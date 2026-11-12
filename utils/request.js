const config = require('../config');

let cloudReady = false;
let cloudUnavailable = false;

function initCloud() {
  if (!config.useCloud || cloudUnavailable) return false;
  if (cloudReady) return true;
  if (!wx.cloud || typeof wx.cloud.init !== 'function') return false;
  try {
    wx.cloud.init({ env: config.cloudEnv, traceUser: true });
    cloudReady = true;
  } catch (err) {
    console.warn('[request] 云托管初始化失败，将使用 apiBaseUrl', err);
    cloudReady = false;
  }
  return cloudReady;
}

function queryString(data) {
  const parts = [];
  Object.keys(data || {}).forEach((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  return parts.join('&');
}

function normalizeError(statusCode, body) {
  const error = new Error((body && body.message) || (statusCode ? `请求失败（${statusCode}）` : '请求失败'));
  error.code = body && body.code;
  error.statusCode = statusCode;
  return error;
}

function handleResponse(statusCode, raw, resolve, reject) {
  let body = raw;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      reject(new Error('服务返回了无法解析的内容'));
      return;
    }
  }
  if (statusCode >= 200 && statusCode < 300 && body && body.code === 0) {
    resolve(body.data);
    return;
  }
  reject(normalizeError(statusCode, body));
}

function cloudCall(path, method, data, header) {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: config.cloudEnv },
      path,
      method,
      header: Object.assign(
        {
          'X-WX-SERVICE': config.cloudService,
          'content-type': 'application/json'
        },
        header || {}
      ),
      data: method === 'GET' ? undefined : data,
      timeout: config.requestTimeout,
      success(res) {
        handleResponse(res.statusCode, res.data, resolve, reject);
      },
      fail(err) {
        const error = new Error(
          err && err.errMsg && err.errMsg.indexOf('timeout') >= 0
            ? '请求超时，请稍后重试'
            : '网络连接失败，请检查云托管服务是否正常'
        );
        error.network = true;
        reject(error);
      }
    });
  });
}

function httpCall(path, method, data, header) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.apiBaseUrl + path,
      method,
      data: method === 'GET' ? undefined : data,
      header: Object.assign({ 'content-type': 'application/json' }, header || {}),
      timeout: config.requestTimeout,
      success(res) {
        handleResponse(res.statusCode, res.data, resolve, reject);
      },
      fail(err) {
        const error = new Error(
          err && err.errMsg && err.errMsg.indexOf('timeout') >= 0
            ? '请求超时，请稍后重试'
            : '网络连接失败，请检查服务地址'
        );
        error.network = true;
        reject(error);
      }
    });
  });
}

/**
 * 发起业务请求，成功时直接返回响应体中的 data。
 * @param {{path:string, method?:string, data?:object, header?:object}} options
 */
function request(options = {}) {
  let path = options.path || '';
  if (!path || path.charAt(0) !== '/') {
    return Promise.reject(new Error('请求路径不合法'));
  }
  const method = (options.method || 'GET').toUpperCase();
  const data = options.data || {};

  if (method === 'GET') {
    const query = queryString(data);
    if (query) path += (path.indexOf('?') >= 0 ? '&' : '?') + query;
  }

  if (initCloud()) {
    return cloudCall(path, method, data, options.header).catch((err) => {
      if (!err || !err.network) throw err;
      // 云托管调用失败（本地调试 / 服务未部署）时，回退到测试域名，避免整站不可用
      console.warn('[request] 云托管调用失败，回退到 apiBaseUrl：', err.message);
      cloudUnavailable = true;
      return httpCall(path, method, data, options.header);
    });
  }
  return httpCall(path, method, data, options.header);
}

/** 把后端返回的相对图片地址补全为可直接展示的 HTTPS 地址 */
function assetUrl(value) {
  if (!value) return '';
  const url = String(value);
  // https/http、data: 以及云存储 fileID（cloud://）都直接交给 <image> 使用。
  if (/^(https?:\/\/|cloud:\/\/|data:)/i.test(url)) return url;
  const base = config.assetBaseUrl.replace(/\/+$/, '');
  return base + (url.charAt(0) === '/' ? url : `/${url}`);
}

module.exports = {
  request,
  assetUrl,
  initCloud,
  queryString
};
