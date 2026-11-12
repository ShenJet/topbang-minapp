/** 价格区间：min / max 单位为万元 */
const PRICE_RANGES = [
  { id: '', label: '全部' },
  { id: 'lt3', label: '3万以下', min: null, max: 3 },
  { id: '3-5', label: '3–5万', min: 3, max: 5 },
  { id: '5-8', label: '5–8万', min: 5, max: 8 },
  { id: '8-15', label: '8–15万', min: 8, max: 15 },
  { id: 'gte15', label: '15万以上', min: 15, max: null }
];

const YEAR_RANGES = [
  { id: '', label: '全部' },
  { id: 'le2008', label: '2008年以前', min: null, max: 2008 },
  { id: '2009-2012', label: '2009–2012', min: 2009, max: 2012 },
  { id: '2013-2016', label: '2013–2016', min: 2013, max: 2016 },
  { id: '2017-2020', label: '2017–2020', min: 2017, max: 2020 },
  { id: 'gte2021', label: '2021年以后', min: 2021, max: null }
];

const MILEAGE_RANGES = [
  { id: '', label: '全部' },
  { id: '0-5', label: '5万内', min: 0, max: 5 },
  { id: '5-10', label: '5–10万', min: 5, max: 10 },
  { id: '10-15', label: '10–15万', min: 10, max: 15 },
  { id: 'gte15', label: '15万以上', min: 15, max: null }
];

const DISPLACEMENT_GROUPS = [
  { id: '', label: '全部' },
  { id: 'le1.6', label: '1.6L及以下' },
  { id: '1.7-1.9', label: '1.7–1.9L' },
  { id: '2.0-2.5', label: '2.0–2.5L' },
  { id: '3.0-3.6', label: '3.0–3.6L' },
  { id: 'ge4.0', label: '4.0L以上' }
];

function emptyFilters() {
  return {
    license_region: '',
    vehicle_type: '',
    price: '',
    year: '',
    mileage: '',
    displacement_group: ''
  };
}

function findRange(list, id) {
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function activeFilterCount(filters) {
  const value = filters || {};
  let count = 0;
  ['license_region', 'vehicle_type', 'price', 'year', 'mileage', 'displacement_group'].forEach((key) => {
    if (value[key]) count += 1;
  });
  return count;
}

function filterLabels(filters) {
  const value = filters || {};
  const price = findRange(PRICE_RANGES, value.price);
  return {
    region: value.license_region || '牌照',
    price: price && price.id ? price.label : '价格',
    type: value.vehicle_type || '类型'
  };
}

/** 把前端筛选状态转换为后端查询参数 */
function toQuery(filters) {
  const value = filters || {};
  const query = {};

  if (value.license_region) query.license_region = value.license_region;
  if (value.vehicle_type) query.vehicle_type = value.vehicle_type;

  const price = findRange(PRICE_RANGES, value.price);
  if (price) {
    if (price.min !== null && price.min !== undefined) query.price_min = Math.round(price.min * 10000);
    if (price.max !== null && price.max !== undefined) query.price_max = Math.round(price.max * 10000);
  }

  const year = findRange(YEAR_RANGES, value.year);
  if (year) {
    if (year.min !== null && year.min !== undefined) query.year_from = year.min;
    if (year.max !== null && year.max !== undefined) query.year_to = year.max;
  }

  const mileage = findRange(MILEAGE_RANGES, value.mileage);
  if (mileage) {
    if (mileage.min !== null && mileage.min !== undefined) query.mileage_min = mileage.min;
    if (mileage.max !== null && mileage.max !== undefined) query.mileage_max = mileage.max;
  }

  if (value.displacement_group) query.displacement_group = value.displacement_group;

  return query;
}

module.exports = {
  PRICE_RANGES,
  YEAR_RANGES,
  MILEAGE_RANGES,
  DISPLACEMENT_GROUPS,
  emptyFilters,
  findRange,
  activeFilterCount,
  filterLabels,
  toQuery
};
