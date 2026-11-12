const app = getApp();
const { request } = require('../../utils/request');
const { normalizeVehicle } = require('../../utils/mapper');

Page({
  data: {
    loading: true,
    error: '',
    vehicle: null,
    currentImage: 0,
    store: {}
  },

  onLoad(options) {
    this.vehicleId = (options && (options.id || options.code)) || '';
    this.loadStore();
    this.load();

    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },

  loadStore() {
    app.getConfig().then((data) => {
      if (data && data.store) this.setData({ store: data.store });
    });
  },

  load() {
    if (!this.vehicleId) {
      this.setData({ loading: false, error: '缺少车源编号，请返回列表重新选择' });
      return;
    }

    this.setData({ loading: true, error: '' });
    request({ path: `/api/vehicles/${encodeURIComponent(this.vehicleId)}` })
      .then((raw) => {
        const vehicle = normalizeVehicle(raw);
        this.setData({ vehicle, loading: false, currentImage: 0 });
        wx.setNavigationBarTitle({ title: vehicle.title || '车源详情' });
      })
      .catch((err) => {
        this.setData({
          loading: false,
          error: err.message || '车源不存在或已下架'
        });
      });
  },

  onSwiperChange(event) {
    this.setData({ currentImage: event.detail.current || 0 });
  },

  onPreview() {
    const vehicle = this.data.vehicle;
    const images = (vehicle && vehicle.images_full) || [];
    if (!images.length) return;
    wx.previewImage({
      current: images[this.data.currentImage] || images[0],
      urls: images
    });
  },

  copyText(value, label) {
    const text = String(value || '').trim();
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: `${label || '内容'}已复制`, icon: 'none' });
      },
      fail() {
        wx.showToast({ title: '复制失败，请手动复制', icon: 'none' });
      }
    });
  },

  onCopy(event) {
    const dataset = event.currentTarget.dataset || {};
    this.copyText(dataset.copy, dataset.label);
  },

  onContact() {
    const vehicle = this.data.vehicle;
    if (!vehicle) return;

    const store = Object.assign({}, app.globalData.store || {}, this.data.store || {});
    const wechat = String(store.contact_wechat || '').trim();
    const phone = String(store.contact_phone || '').trim();
    const code = vehicle.code || '';

    if (!wechat && !phone) {
      wx.showModal({
        title: '联系商家',
        content: `请先复制车源编号 ${code}，再通过小程序客服留言，商家会尽快回复。`,
        confirmText: '复制编号',
        success: (res) => {
          if (res.confirm) this.copyText(code, '车源编号');
        }
      });
      return;
    }

    const items = [];
    const actions = [];
    if (wechat) {
      items.push('复制客服微信号');
      actions.push('wechat');
    }
    if (phone) {
      items.push('拨打客服电话');
      actions.push('phone');
    }
    items.push(`复制车源编号 ${code}`);
    actions.push('code');

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const action = actions[res.tapIndex];
        if (action === 'wechat') {
          this.copyText(wechat, '客服微信号');
        } else if (action === 'phone') {
          wx.makePhoneCall({ phoneNumber: phone });
        } else if (action === 'code') {
          this.copyText(code, '车源编号');
        }
      }
    });
  },

  goHome() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onShareAppMessage() {
    const vehicle = this.data.vehicle;
    if (!vehicle) {
      return { title: '掏棒的车库 · 精选二手车', path: '/pages/index/index' };
    }
    const payload = {
      title: `${vehicle.title}｜${vehicle.price_text}`,
      path: `/pages/detail/detail?id=${vehicle.id}`
    };
    if (/^https:\/\//i.test(vehicle.cover_url)) {
      payload.imageUrl = vehicle.cover_url;
    }
    return payload;
  },

  onShareTimeline() {
    const vehicle = this.data.vehicle;
    if (!vehicle) {
      return { title: '掏棒的车库 · 精选二手车' };
    }
    const payload = {
      title: `${vehicle.title}｜${vehicle.price_text}`,
      query: `id=${vehicle.id}`
    };
    if (/^https:\/\//i.test(vehicle.cover_url)) {
      payload.imageUrl = vehicle.cover_url;
    }
    return payload;
  }
});
