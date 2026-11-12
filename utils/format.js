function trimZeros(value) {
  return String(value).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatPrice(yuan) {
  const n = Number(yuan);
  if (!Number.isFinite(n) || n <= 0) return '面议';
  return `${trimZeros((n / 10000).toFixed(2))}万`;
}

/** 预算单位为「万元」 */
function formatBudget(min, max) {
  const low = min === null || min === undefined || min === '' ? null : Number(min);
  const high = max === null || max === undefined || max === '' ? null : Number(max);
  if (low === null && high === null) return '预算面议';
  if (low !== null && high !== null) return `${trimZeros(low)}–${trimZeros(high)}万`;
  if (low !== null) return `${trimZeros(low)}万以上`;
  return `${trimZeros(high)}万以内`;
}

function pad(value) {
  return value < 10 ? `0${value}` : String(value);
}

function relativeTime(input) {
  const text = String(input || '');
  if (!text) return '';
  const normalized = text.indexOf('T') >= 0 ? text : text.replace(/-/g, '/');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return text;

  const diff = Date.now() - date.getTime();
  if (diff < 0) return '刚刚';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 2 * day) return '昨天';
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(input) {
  const text = String(input || '');
  if (!text) return '';
  const normalized = text.indexOf('T') >= 0 ? text : text.replace(/-/g, '/');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return text;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

module.exports = {
  trimZeros,
  formatPrice,
  formatBudget,
  relativeTime,
  formatDate
};
