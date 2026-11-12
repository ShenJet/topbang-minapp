# 掏棒的车库 · 二手车小程序（粉丝端）

二手车车库的微信小程序前端。粉丝可以在小程序里逛车、按板块筛选、查看车源详情，并提交淘车求购需求。

后端仓库见 [topbang](../topbang)。

## 技术栈

**原生微信小程序**（WXML + WXSS + JavaScript），不引入 Taro / uni-app / 构建工具。

选择原因：

- 项目只有浏览、筛选、表单三类轻交互，原生足够覆盖，包体小、启动快
- 直接使用 `wx.cloud.callContainer` 调用微信云托管，免配置 request 合法域名
- 无需 Node 构建链，微信开发者工具导入即可运行，降低部署与维护成本

## 目录结构

```
topbang-minapp/
├── app.js / app.json / app.wxss   # 全局配置、店铺配置缓存、基础样式
├── config.js                      # 云托管环境、服务名、API / 图片地址
├── project.config.json            # 开发者工具项目配置（AppID 已写入）
├── sitemap.json
├── components/
│   ├── car-card/                  # 车源卡片（封面、徽标、价格、编号）
│   └── filter-sheet/              # 六维筛选底部弹层
├── pages/
│   ├── index/                     # 逛车：板块、搜索、筛选、分页列表
│   ├── detail/                    # 车源详情：相册、参数、音频、寄售、联系商家
│   └── purchase/                  # 淘车求购：需求表单 + 公开求购榜
└── utils/
    ├── request.js                 # 云托管调用、HTTP 回退、图片地址补全
    ├── mapper.js                  # 接口数据 → 页面展示字段
    ├── format.js                  # 价格（万）、预算、相对时间
    └── options.js                 # 价格/年份/里程/排量筛选区间
```

## 页面与功能

### 逛车 `pages/index/index`

- 顶部店铺品牌区：店名、slogan、车源总数、在售板块数、地址
- 搜索：品牌 / 车型 / 编号关键词，400ms 防抖
- 板块横向切换：全部 + 后台启用的板块（求购板块不展示）
- 六维筛选：牌照地区、价格、车型、年份、里程、排量
- 车源卡片：封面、新上架 / 寄售徽标、音频标识、价格、地区 / 年款 / 里程
- 下拉刷新、触底分页、骨架屏、空状态、分享

### 车源详情 `pages/detail/detail`

- 图片轮播 + 点击预览、图片数量、新上架 / 寄售徽标
- 标题、价格、核心参数、音频品牌、车况描述、寄售说明
- 联系商家：复制客服微信 / 拨打电话 / 复制车源编号
- 分享给好友与朋友圈

### 淘车求购 `pages/purchase/purchase`

- 求购表单：品牌车型、预算区间（万元）、意向牌照地区、称呼、联系方式、备注
- 前端校验 + 后端限流（5 次/分钟）
- 提交成功后重置表单并刷新榜单
- 近 30 天公开求购榜：昵称脱敏、预算、地区、需求状态；不展示联系方式
- 商家联系方式卡片，支持一键复制

## 本地运行

### 1. 启动后端

先按 [topbang README](../topbang/README.md) 启动后端（默认 `http://127.0.0.1:3000`），确保 `/api/health` 正常。

### 2. 导入小程序

1. 打开微信开发者工具 → 导入项目
2. 目录选择本仓库 `topbang-minapp`
3. AppID 使用 `project.config.json` 中的 `wx20c25015572e496e`（或替换为自己的 AppID）

### 3. 调试模式

把 `config.js` 顶部的 `useCloud` 改为 `false` 即可，本地地址由 `localBaseUrl` 自动接管：

```js
const useCloud = false;
const localBaseUrl = 'http://127.0.0.1:3000'; // 真机调试改成电脑局域网 IP
```

并在开发者工具「详情 → 本地设置」勾选：

- 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书

本地调试请务必使用 `useCloud: false`。`useCloud: true` 时 `apiBaseUrl` / `assetBaseUrl` 会自动使用云端域名，避免出现“API 走云托管、图片却指向 127.0.0.1”的混合状态。

### 4. 云托管模式（推荐）

`config.js` 当前已按测试环境填写，并把 `useCloud` 作为唯一开关：

```js
const useCloud = true;
const cloudBaseUrl = 'https://koa-43g1-345809-11-1529810308.sh.run.tcloudbase.com';

cloudEnv: 'prod-d9gqon58692ae91cf',
cloudService: 'koa-43g1',
useCloud,
apiBaseUrl: useCloud ? cloudBaseUrl : localBaseUrl,
assetBaseUrl: useCloud ? cloudBaseUrl : localBaseUrl
```

微信开发者工具 / 体验版中需要：

1. 开通云开发，并确保当前小程序被授权访问该云托管环境
2. 云托管服务已部署、已开启公网访问，服务名与 `cloudService` 一致
3. 若部署了新的服务 / 环境，同步修改 `cloudEnv`、`cloudService` 与 `cloudBaseUrl`
4. 体验版发布前确认 `useCloud: true`，不要把两个域名留成 `127.0.0.1`

说明：

- API 请求走 `wx.cloud.callContainer`，请求头带 `X-WX-SERVICE`，不占用小程序 request 合法域名
- 图片通过 `<image src="{{cover_url}}">` 加载；后端默认返回 `/api/uploads/:id`，由 `assetBaseUrl` 拼成云托管域名下的 HTTPS 地址。若后端配置了 `COS_PUBLIC_BASE_URL`，会直接返回 COS/CDN 的绝对地址
- 若改用 HTTP 回退，或出现 COS/CDN 绝对图片地址，需要在小程序后台配置 request 合法域名与 downloadFile 合法域名
- 若图片地址是 `cos.ap-shanghai.myqcloud.com` 且返回 403，说明桶是私有读；请清空 `COS_PUBLIC_BASE_URL` 改用后端代理，或把桶设为公有读 / 绑定 CDN 域名
- 若图片地址是云托管域名但返回 502，检查后端日志中的 `[uploads] COS 读取失败`，以及 `COS_USE_OPEN_API` 与开放接口服务是否配置正确

## 数据与接口

接口约定：`{ code: 0, message: 'ok', data }`，非 0 即失败。主要接口：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/config` | 店铺信息与板块 |
| GET | `/api/vehicles` | 车源列表（板块、关键词、六维筛选、分页） |
| GET | `/api/vehicles/facets` | 筛选项 |
| GET | `/api/vehicles/:idOrCode` | 车源详情 |
| GET | `/api/purchase-requests` | 公开求购榜 |
| POST | `/api/purchase-requests` | 提交求购 |

价格展示：后端返回「元」，小程序统一格式化为「万」；求购预算后端直接存「万元」。

## 上线检查

- [ ] `config.js` 指向正式云托管环境与服务，且 `useCloud: true`
- [ ] `apiBaseUrl` / `assetBaseUrl` 不是 `127.0.0.1` 或局域网 IP
- [ ] 后端已部署并开启公网访问，`/api/health`、`/api/config`、`/api/uploads/:id` 可直接访问
- [ ] 小程序后台配置服务类目、隐私协议（收集联系方式用于商家回访）
- [ ] 真机验证图片加载、拨打电话、复制微信、分享
- [ ] 如需 HTTP 回退，配置 request 合法域名并使用 HTTPS
- [ ] 在后台「系统设置」维护店铺名称、slogan、客服微信、电话、地址
