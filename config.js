/**
 * 小程序全局配置
 *
 * 线上体验版 / 正式版：useCloud = true。
 *   - API 走 wx.cloud.callContainer（cloudEnv + cloudService）
 *   - 图片走云托管 HTTPS 域名下的 /api/uploads/:id（assetBaseUrl）
 *
 * 本地调试：useCloud = false，API 和图片都走 localBaseUrl。
 *   开发者工具需关闭「不校验合法域名」；真机调试需把 localBaseUrl
 *   改成电脑的局域网 IP（如 http://192.168.1.10:3000）。
 *
 * 注意：useCloud = true 时，apiBaseUrl / assetBaseUrl 必须是云端域名；
 * 写成 127.0.0.1 会让体验版 API 走云托管、图片却指向手机本机，导致图片加载失败。
 */

const useCloud = true;

// 云托管服务测试域名（与 cloudService 对应）
const cloudBaseUrl = 'https://koa-43g1-345809-11-1529810308.sh.run.tcloudbase.com';
// 本地 Koa 服务地址；真机调试时改成电脑局域网 IP
const localBaseUrl = 'http://127.0.0.1:3000';

module.exports = {
  cloudEnv: 'prod-d9gqon58692ae91cf',
  cloudService: 'koa-43g1',
  useCloud,

  // request.js 在云托管调用失败时会回退到 apiBaseUrl，所以这里也必须用云端域名。
  apiBaseUrl: useCloud ? cloudBaseUrl : localBaseUrl,
  assetBaseUrl: useCloud ? cloudBaseUrl : localBaseUrl,

  requestTimeout: 15000,
  pageSize: 10
};
