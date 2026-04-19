/**
 * 邻盟小程序 API 配置
 * 
 * 使用说明：
 * - 开发环境（开发者工具）：使用 localhost:3000
 * - 手机预览/真机调试：使用服务器地址
 */

// 开发环境（本地调试，仅限开发者工具）
const DEV_CONFIG = {
  apiBase: 'http://127.0.0.1:3000/api',
  wsBase: 'ws://127.0.0.1:3000'
}

// 服务器环境（手机预览/真机调试/生产环境）
// 注意：小程序真机必须使用 HTTPS
// 当前方案：使用 HTTP + IP 地址（临时方案）
// 正式上线：需要在微信公众平台配置 request 合法域名
const SERVER_CONFIG = {
  apiBase: 'http://150.158.12.243/api',
  wsBase: 'ws://150.158.12.243'
}

// 当前环境判断
// 开发者工具调试用 'dev'，手机预览用 'server'
const ENV = 'server'

const CONFIG = ENV === 'dev' ? DEV_CONFIG : SERVER_CONFIG

module.exports = CONFIG
