const app = getApp();
const config = require('../../config');
const { request } = require('../../utils/request');
const { normalizeVehicle } = require('../../utils/mapper');
const {
  emptyFilters,
  activeFilterCount,
  filterLabels,
  toQuery
} = require('../../utils/options');

Page({
  data: {
    store: {},
    boards: [],
    garageTotal: 0,

    boardKey: '',
    keyword: '',
    filters: emptyFilters(),
    chipLabels: { region: '牌照', price: '价格', type: '类型' },
    filterCount: 0,
    filterVisible: false,
    regionOptions: [],
    typeOptions: [],

    items: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: true,
    loadingMore: false,

    boardTitle: '全部在售',
    sortText: '按更新时间倒序'
  },

  onLoad() {
    this.reqId = 0;
    this.searchTimer = null;
    this.loadConfig(false);
    this.loadFacets();
    this.loadVehicles(true);
  },

  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadConfig(true),
      this.loadFacets(),
      this.loadVehicles(true)
    ]).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.loading) {
      this.loadVehicles(false);
    }
  },

  onShareAppMessage() {
    const store = this.data.store || {};
    return {
      title: `${store.name || '掏棒的车库'} · ${store.slogan || '精选二手车'}`,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    const store = this.data.store || {};
    return {
      title: `${store.name || '掏棒的车库'} · ${store.slogan || '精选二手车'}`
    };
  },

  loadConfig(refresh) {
    const task = refresh ? app.refreshConfig() : app.getConfig();
    return task.then((data) => {
      if (!data) return;
      const allBoards = data.boards || [];
      const boards = allBoards.filter((board) => board.key !== 'purchase');
      const allBoard = allBoards.filter((board) => board.key === 'all')[0];
      const stillValid = this.data.boardKey
        && boards.some((board) => board.key === this.data.boardKey);

      this.setData({
        store: data.store || {},
        boards,
        garageTotal: allBoard ? Number(allBoard.count) || 0 : 0,
        boardKey: stillValid ? this.data.boardKey : ''
      }, () => {
        this.updateBoardTitle();
      });
    });
  },

  loadFacets() {
    return request({ path: '/api/vehicles/facets' })
      .then((facets) => {
        const regions = ((facets && facets.regions) || [])
          .map((item) => item.value)
          .filter(Boolean);
        const types = ((facets && facets.types) || [])
          .map((item) => item.value)
          .filter(Boolean);

        this.setData({
          regionOptions: regions.length ? regions : ['苏E', '苏U', '沪牌'],
          typeOptions: types.length ? types : ['轿车', 'SUV', '跑车', '旅行车', 'MPV']
        });
      })
      .catch(() => {
        // 筛选项加载失败不阻塞主列表
      });
  },

  loadVehicles(reset) {
    if (!reset && (this.data.loadingMore || !this.data.hasMore)) {
      return Promise.resolve();
    }

    const page = reset ? 1 : this.data.page + 1;
    const reqId = (this.reqId || 0) + 1;
    this.reqId = reqId;

    this.setData(reset ? { loading: true } : { loadingMore: true });

    const query = Object.assign(
      { page, page_size: config.pageSize },
      toQuery(this.data.filters)
    );
    if (this.data.boardKey) query.board = this.data.boardKey;
    const keyword = String(this.data.keyword || '').trim();
    if (keyword) query.keyword = keyword;

    return request({ path: '/api/vehicles', data: query })
      .then((res) => {
        if (reqId !== this.reqId) return;
        const mapped = ((res && res.items) || [])
          .map(normalizeVehicle)
          .filter(Boolean);
        const items = reset ? mapped : this.data.items.concat(mapped);

        this.setData({
          items,
          total: Number(res && res.total) || 0,
          page: (res && res.page) || page,
          hasMore: !!(res && res.has_more),
          loading: false,
          loadingMore: false
        });
      })
      .catch((err) => {
        if (reqId !== this.reqId) return;
        this.setData({ loading: false, loadingMore: false });
        wx.showToast({
          title: err.message || '车源加载失败',
          icon: 'none',
          duration: 2400
        });
      });
  },

  updateBoardTitle() {
    const board = (this.data.boards || [])
      .filter((item) => item.key === this.data.boardKey)[0];
    this.setData({
      boardTitle: board ? board.name : '全部在售',
      sortText: this.data.boardKey === 'new' ? '按上架时间倒序' : '按更新时间倒序'
    });
  },

  onBoard(event) {
    const key = event.currentTarget.dataset.key || '';
    if (key === this.data.boardKey) return;
    this.setData({ boardKey: key }, () => {
      this.updateBoardTitle();
      wx.pageScrollTo({ scrollTop: 0, duration: 220 });
      this.loadVehicles(true);
    });
  },

  onKeywordInput(event) {
    const keyword = event.detail.value;
    this.setData({ keyword });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.loadVehicles(true);
    }, 400);
  },

  onSearch() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
    this.loadVehicles(true);
  },

  onClearKeyword() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.setData({ keyword: '' }, () => {
      this.loadVehicles(true);
    });
  },

  openFilter() {
    this.setData({ filterVisible: true });
  },

  onFilterClose() {
    this.setData({ filterVisible: false });
  },

  onFilterApply(event) {
    const value = Object.assign(
      emptyFilters(),
      (event.detail && event.detail.value) || {}
    );
    this.setData({
      filters: value,
      filterCount: activeFilterCount(value),
      chipLabels: filterLabels(value),
      filterVisible: false
    }, () => {
      this.loadVehicles(true);
    });
  },

  goPurchase() {
    wx.switchTab({ url: '/pages/purchase/purchase' });
  }
});
