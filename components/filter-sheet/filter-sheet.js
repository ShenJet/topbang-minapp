const {
  PRICE_RANGES,
  YEAR_RANGES,
  MILEAGE_RANGES,
  DISPLACEMENT_GROUPS,
  emptyFilters,
  activeFilterCount
} = require('../../utils/options');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    value: {
      type: Object,
      value: {}
    },
    regions: {
      type: Array,
      value: []
    },
    types: {
      type: Array,
      value: []
    }
  },

  data: {
    draft: emptyFilters(),
    groups: [],
    activeCount: 0
  },

  observers: {
    'visible, value, regions, types': function onFilterChange(visible, value, regions, types) {
      if (!visible) return;
      const draft = Object.assign(emptyFilters(), value || {});
      this.setData({ draft }, () => {
        this.buildGroups();
      });
    }
  },

  methods: {
    buildGroups() {
      const draft = this.data.draft;
      const regionOptions = [{ id: '', label: '全部' }].concat(
        (this.data.regions || []).map((item) => ({ id: item, label: item }))
      );
      const typeOptions = [{ id: '', label: '全部' }].concat(
        (this.data.types || []).map((item) => ({ id: item, label: item }))
      );

      const groups = [
        {
          key: 'license_region',
          label: '牌照所在地',
          selected: draft.license_region,
          options: regionOptions
        },
        {
          key: 'price',
          label: '价格区间',
          selected: draft.price,
          options: PRICE_RANGES
        },
        {
          key: 'vehicle_type',
          label: '车辆类型',
          selected: draft.vehicle_type,
          options: typeOptions
        },
        {
          key: 'year',
          label: '年款',
          selected: draft.year,
          options: YEAR_RANGES
        },
        {
          key: 'mileage',
          label: '里程（万公里）',
          selected: draft.mileage,
          options: MILEAGE_RANGES
        },
        {
          key: 'displacement_group',
          label: '排量',
          selected: draft.displacement_group,
          options: DISPLACEMENT_GROUPS
        }
      ];

      this.setData({
        groups,
        activeCount: activeFilterCount(draft)
      });
    },

    onPick(event) {
      const group = event.currentTarget.dataset.group;
      const value = event.currentTarget.dataset.value || '';
      const draft = Object.assign({}, this.data.draft, { [group]: value });
      this.setData({ draft }, () => {
        this.buildGroups();
      });
    },

    onReset() {
      this.setData({ draft: emptyFilters() }, () => {
        this.buildGroups();
      });
    },

    onApply() {
      this.triggerEvent('apply', { value: this.data.draft });
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {}
  }
});
