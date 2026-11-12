const { assetUrl } = require('./request');
const { formatPrice, formatBudget, relativeTime, trimZeros } = require('./format');

function splitPrice(yuan) {
  const n = Number(yuan) || 0;
  if (n <= 0) return { num: '面议', unit: '' };
  return { num: trimZeros((n / 10000).toFixed(2)), unit: '万' };
}

function normalizeVehicle(raw) {
  if (!raw) return null;
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const images = rawImages.map(assetUrl).filter(Boolean);
  const cover = raw.cover ? assetUrl(raw.cover) : images[0] || '';
  const price = splitPrice(raw.price);
  const region = raw.license_region || '牌照待定';
  const year = raw.year ? `${raw.year}款` : '年款待录入';
  const mileage = raw.mileage !== null && raw.mileage !== undefined
    ? `${trimZeros(raw.mileage)}万公里`
    : '里程待录入';

  return Object.assign({}, raw, {
    images_full: images,
    cover_url: cover,
    has_cover: !!cover,
    price_text: formatPrice(raw.price),
    price_num: price.num,
    price_unit: price.unit,
    region_text: region,
    year_text: year,
    mileage_text: mileage,
    displacement_text: raw.displacement || '待录入',
    audio_brand: raw.audio_brand || '',
    board_label: raw.board_name || raw.board_key || '',
    // 寄售人属于商家内部信息，粉丝端不展示
    consignor: '',
    is_new: !!raw.is_new,
    is_consignment: !!raw.is_consignment,
    meta_text: [region, year, mileage].join(' · ')
  });
}

function normalizeRequest(raw) {
  if (!raw) return null;
  return Object.assign({}, raw, {
    nickname: raw.nickname || '微信粉丝',
    budget_text: formatBudget(raw.budget_min, raw.budget_max),
    region_text: raw.region || '地区不限',
    time_text: relativeTime(raw.created_at),
    status_text: raw.status_text || '新需求',
    status_class: `status-${raw.status || 'new'}`
  });
}

module.exports = {
  normalizeVehicle,
  normalizeRequest,
  splitPrice
};
