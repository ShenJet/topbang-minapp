const config = require('./config');
const { request } = require('./utils/request');

App({
  globalData: {
    store: {},
    boards: [],
    statusBarHeight: 20,
    configReady: null,
    configLoaded: false,
    configError: ''
  },

  onLaunch() {
    if (wx.cloud && config.useCloud) {
      try {
        wx.cloud.init({ env: config.cloudEnv, traceUser: true });
      } catch (err) {
        console.warn('[app] wx.cloud.init 失败', err);
      }
    }

    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.globalData.statusBarHeight = info.statusBarHeight || 20;
    } catch (err) {
      // 忽略，使用默认状态栏高度
    }

    this.globalData.configReady = this.fetchConfig();
  },

  fetchConfig() {
    return request({ path: '/api/config' })
      .then((data) => {
        this.globalData.store = (data && data.store) || {};
        this.globalData.boards = (data && data.boards) || [];
        this.globalData.configLoaded = true;
        this.globalData.configError = '';
        return data;
      })
      .catch((err) => {
        this.globalData.configError = err.message || '配置加载失败';
        return null;
      });
  },

  getConfig() {
    if (!this.globalData.configReady) {
      this.globalData.configReady = this.fetchConfig();
    }
    return this.globalData.configReady;
  },

  refreshConfig() {
    this.globalData.configReady = this.fetchConfig();
    return this.globalData.configReady;
  }
});
