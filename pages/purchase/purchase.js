const app = getApp();
const { request } = require('../../utils/request');
const { normalizeRequest } = require('../../utils/mapper');

const REGION_CHOICES = ['不限地区', '苏州（苏E/苏U）', '上海（沪牌）', '浙江（浙B）', '其他地区'];
const EMPTY_FORM = {
  brand_model: '',
  budget_min: '',
  budget_max: '',
  nickname: '',
  contact: '',
  note: ''
};

function parseBudget(value) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

Page({
  data: {
    store: {},
    form: Object.assign({}, EMPTY_FORM),
    regionChoices: REGION_CHOICES,
    regionIndex: 0,
    submitting: false,
    requests: [],
    loadingList: true,
    listError: ''
  },

  onLoad() {
    this.loadStore(false);
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    Promise.all([this.loadStore(true), this.loadList()])
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const store = this.data.store || {};
    return {
      title: `${store.name || '掏棒的车库'} · 淘车求购`,
      path: '/pages/purchase/purchase'
    };
  },

  onShareTimeline() {
    const store = this.data.store || {};
    return {
      title: `${store.name || '掏棒的车库'} · 淘车求购`
    };
  },

  loadStore(refresh) {
    const task = refresh ? app.refreshConfig() : app.getConfig();
    return task.then((data) => {
      if (data && data.store) this.setData({ store: data.store });
    });
  },

  loadList() {
    this.setData({ loadingList: true, listError: '' });
    return request({ path: '/api/purchase-requests', data: { limit: 20 } })
      .then((items) => {
        const requests = (Array.isArray(items) ? items : [])
          .map(normalizeRequest)
          .filter(Boolean);
        this.setData({ requests, loadingList: false });
      })
      .catch((err) => {
        this.setData({
          loadingList: false,
          listError: err.message || '求购榜单加载失败，请稍后重试'
        });
      });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!field || !(field in EMPTY_FORM)) return;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onRegionChange(event) {
    this.setData({ regionIndex: Number(event.detail.value) || 0 });
  },

  validate() {
    const form = this.data.form;
    const brandModel = String(form.brand_model || '').trim();
    if (brandModel.length < 2) {
      return '请填写想买的品牌 / 车型';
    }

    const contact = String(form.contact || '').trim();
    if (contact.length < 2) {
      return '请填写微信号或手机号，方便商家联系你';
    }

    const budgetMin = parseBudget(form.budget_min);
    const budgetMax = parseBudget(form.budget_max);
    if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) {
      return '预算请填写数字';
    }
    if ((budgetMin != null && (budgetMin < 0 || budgetMin > 1000))
      || (budgetMax != null && (budgetMax < 0 || budgetMax > 1000))) {
      return '预算请填写 0–1000 万之间的数字';
    }
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      return '最低预算不能高于最高预算';
    }
    return '';
  },

  onSubmit() {
    if (this.data.submitting) return;

    const error = this.validate();
    if (error) {
      wx.showToast({ title: error, icon: 'none', duration: 2400 });
      return;
    }

    const form = this.data.form;
    const region = this.data.regionIndex
      ? REGION_CHOICES[this.data.regionIndex]
      : '';

    this.setData({ submitting: true });

    request({
      path: '/api/purchase-requests',
      method: 'POST',
      data: {
        brand_model: String(form.brand_model || '').trim(),
        budget_min: String(form.budget_min || '').trim(),
        budget_max: String(form.budget_max || '').trim(),
        region,
        nickname: String(form.nickname || '').trim(),
        contact: String(form.contact || '').trim(),
        note: String(form.note || '').trim(),
        source: 'miniapp'
      }
    })
      .then(() => {
        this.setData({
          submitting: false,
          form: Object.assign({}, EMPTY_FORM),
          regionIndex: 0
        });
        wx.showModal({
          title: '需求已提交',
          content: '商家已收到你的求购需求，匹配到合适车源后会通过你留下的联系方式与你联系。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#16324F'
        });
        this.loadList();
      })
      .catch((err) => {
        this.setData({ submitting: false });
        wx.showToast({
          title: err.message || '提交失败，请稍后重试',
          icon: 'none',
          duration: 2600
        });
      });
  },

  onCopy(event) {
    const dataset = event.currentTarget.dataset || {};
    const text = String(dataset.copy || '').trim();
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: `${dataset.label || '内容'}已复制`, icon: 'none' });
      },
      fail() {
        wx.showToast({ title: '复制失败，请手动复制', icon: 'none' });
      }
    });
  }
});
