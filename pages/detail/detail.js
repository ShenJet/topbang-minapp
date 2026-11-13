const app = getApp();
const { request } = require('../../utils/request');
const { normalizeVehicle } = require('../../utils/mapper');
const favorites = require('../../utils/favorites');

// 与后端 src/ratings.js 的 key 保持一致；label 以后端返回为准
const RATING_OPTIONS = [
  { key: 'explosive', label: '夯爆了' },
  { key: 'top', label: '太顶了' },
  { key: 'elite', label: '人上人' },
  { key: 'npc', label: 'NPC' },
  { key: 'bad', label: '拉完了' }
];

function blankRatingOptions() {
  return RATING_OPTIONS.map((item) => ({
    key: item.key,
    label: item.label,
    count: 0,
    active: false
  }));
}

Page({
  data: {
    loading: true,
    error: '',
    vehicle: null,
    currentImage: 0,
    store: {},

    isFavorite: false,
    ratingOptions: blankRatingOptions(),
    ratingTotal: 0,
    ratingMine: '',
    ratingMineLabel: '',
    ratingSubmitting: false
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

  onShow() {
    const vehicle = this.data.vehicle;
    if (!vehicle) return;
    const isFavorite = favorites.isFavorite(vehicle.id);
    if (isFavorite !== this.data.isFavorite) {
      this.setData({ isFavorite });
    }
  },

  loadStore() {
    app.getConfig().then((data) => {
      if (data && data.store) this.setData({ store: data.store });
    });
  },

  load() {
    if (!this.vehicleId) {
      this.setData({ loading: false, error: '缺少车源信息，请返回列表重新选择' });
      return;
    }

    this.setData({ loading: true, error: '' });
    request({ path: `/api/vehicles/${encodeURIComponent(this.vehicleId)}` })
      .then((raw) => {
        const vehicle = normalizeVehicle(raw);
        this.setData({
          vehicle,
          loading: false,
          currentImage: 0,
          isFavorite: favorites.isFavorite(vehicle.id)
        });
        wx.setNavigationBarTitle({ title: vehicle.title || '车源详情' });
        this.loadRatings(vehicle.id);
      })
      .catch((err) => {
        this.setData({
          loading: false,
          error: err.message || '车源不存在或已下架'
        });
      });
  },

  loadRatings(vehicleId) {
    if (!vehicleId) return;
    request({ path: `/api/vehicles/${encodeURIComponent(vehicleId)}/ratings` })
      .then((data) => {
        this.applyRatings(data);
      })
      .catch(() => {
        // 评价加载失败不阻塞详情展示，标签仍可点击提交
      });
  },

  applyRatings(data) {
    const items = (data && Array.isArray(data.items)) ? data.items : [];
    const mine = (data && data.mine) || '';
    const options = RATING_OPTIONS.map((option) => {
      const found = items.filter((item) => item && item.key === option.key)[0];
      return {
        key: option.key,
        label: (found && found.label) || option.label,
        count: Number(found && found.count) || 0,
        active: mine === option.key
      };
    });
    const active = options.filter((item) => item.active)[0];

    this.setData({
      ratingOptions: options,
      ratingTotal: Number(data && data.total) || 0,
      ratingMine: mine,
      ratingMineLabel: active ? active.label : ''
    });
  },

  onRate(event) {
    const key = (event.currentTarget.dataset || {}).key || '';
    const vehicle = this.data.vehicle;
    if (!vehicle || !key || this.data.ratingSubmitting) return;

    if (this.data.ratingMine === key) {
      wx.showToast({ title: '已选过该评价', icon: 'none' });
      return;
    }

    this.setData({ ratingSubmitting: true });
    request({
      path: `/api/vehicles/${encodeURIComponent(vehicle.id)}/rating`,
      method: 'POST',
      data: { rating: key }
    })
      .then((data) => {
        this.applyRatings(data);
        this.setData({ ratingSubmitting: false });
        wx.showToast({ title: '评价成功', icon: 'success' });
      })
      .catch((err) => {
        this.setData({ ratingSubmitting: false });
        wx.showToast({
          title: err.message || '评价失败，请稍后再试',
          icon: 'none'
        });
      });
  },

  onToggleFavorite() {
    const vehicle = this.data.vehicle;
    if (!vehicle) return;
    const followed = favorites.toggle(vehicle.id);
    this.setData({ isFavorite: followed });
    wx.showToast({
      title: followed ? '已关注车源' : '已取消关注',
      icon: 'none'
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

  formatVehicleInfo(vehicle) {
    if (!vehicle) return '';
    return [vehicle.title, vehicle.brand, vehicle.model, vehicle.price_text]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join('\n');
  },

  onContact() {
    const vehicle = this.data.vehicle;
    if (!vehicle) return;

    const store = Object.assign({}, app.globalData.store || {}, this.data.store || {});
    const wechat = String(store.contact_wechat || '').trim();
    const phone = String(store.contact_phone || '').trim();
    const info = this.formatVehicleInfo(vehicle);

    if (!wechat && !phone) {
      wx.showModal({
        title: '联系商家',
        content: '请先复制车辆信息，再通过小程序客服留言，商家会尽快回复。',
        confirmText: '复制信息',
        success: (res) => {
          if (res.confirm) this.copyText(info, '车辆信息');
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
    items.push('复制信息');
    actions.push('info');

    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const action = actions[res.tapIndex];
        if (action === 'wechat') {
          this.copyText(wechat, '客服微信号');
        } else if (action === 'phone') {
          wx.makePhoneCall({ phoneNumber: phone });
        } else if (action === 'info') {
          this.copyText(info, '车辆信息');
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
