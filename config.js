/**
 * 小程序全局配置
 *
 * 云托管调用（推荐）：使用 wx.cloud.callContainer，不依赖小程序后台的 request 合法域名。
 * 本地调试：把 useCloud 改为 false，并把 apiBaseUrl 改成本机地址
 *           （如 http://127.0.0.1:3000），同时在开发者工具中关闭“域名校验”。
 *
 * 部署新的云托管服务后，请同步修改 cloudService、apiBaseUrl、assetBaseUrl。
 */
module.exports = {
  cloudEnv: 'prod-d9gqon58692ae91cf',
  cloudService: 'koa-43g1',
  // 本地调试：关闭云托管调用，直接请求本机 Koa 服务。
  // 真机调试时把 127.0.0.1 换成本机局域网 IP（如 http://192.168.1.10:3000）。
  useCloud: true,

  // 本地 Koa 服务地址，用于 API 请求和 <image> 加载 /api/uploads/:id 图片。
  // 开发者工具中需关闭「不校验合法域名」；真机需使用局域网 IP。
  apiBaseUrl: 'http://127.0.0.1:3000',
  assetBaseUrl: 'http://127.0.0.1:3000',

  requestTimeout: 15000,
  pageSize: 10
};
