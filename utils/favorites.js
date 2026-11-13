/**
 * 关注车源：保存在小程序本地缓存，不依赖登录态。
 * 车源以数字 id 作为唯一键。
 */
const STORAGE_KEY = 'favorite_vehicle_ids';

function getIds() {
  try {
    const value = wx.getStorageSync(STORAGE_KEY);
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item)).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function saveIds(ids) {
  try {
    wx.setStorageSync(STORAGE_KEY, ids);
  } catch (err) {
    // 本地缓存写入失败时静默降级，不影响浏览
  }
}

function isFavorite(id) {
  const key = String(id == null ? '' : id);
  if (!key) return false;
  return getIds().indexOf(key) >= 0;
}

/** 切换关注状态，返回切换后的结果（true = 已关注） */
function toggle(id) {
  const key = String(id == null ? '' : id);
  if (!key) return false;
  const ids = getIds();
  const index = ids.indexOf(key);
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.unshift(key);
  }
  saveIds(ids);
  return index < 0;
}

/** 给车源列表补上 is_favorite 字段 */
function decorate(items) {
  const ids = getIds();
  return (items || []).map((item) => {
    if (!item || item.id == null) return item;
    return Object.assign({}, item, { is_favorite: ids.indexOf(String(item.id)) >= 0 });
  });
}

module.exports = {
  getIds,
  isFavorite,
  toggle,
  decorate
};
