/**
 * 通用 webview 页面
 * 用于嵌入 H5 页面
 * 支持参数：
 *   - url：完整 H5 地址（优先）
 *   - path：相对路径，自动拼接服务器基地址（如 /community/demands/publish）
 *   - title：导航栏标题（可选）
 */
const app = getApp()

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    let { url, path, title } = options

    // 解码 URL
    if (url) {
      url = decodeURIComponent(url)
    } else if (path) {
      // 自动拼接服务器地址（去掉 /api 后缀，使用 H5 地址）
      const base = app.globalData.apiBase.replace('/api', '')
      url = base + decodeURIComponent(path)
    }

    // 小程序已登录用户：带上 token 和 userType 传给 H5
    const token = app.globalData.token
    const userType = app.globalData.userType
    if (token && url && url.indexOf('?') > -1) {
      url += `&token=${encodeURIComponent(token)}&userType=${encodeURIComponent(userType || '')}`
    } else if (token && url) {
      url += `?token=${encodeURIComponent(token)}&userType=${encodeURIComponent(userType || '')}`
    }

    if (title) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(title) })
    }

    this.setData({ url })
  },

  // 接收 H5 发来的消息（如跳转、登录状态同步等）
  onMessage(e) {
    const data = e.detail.data
    if (data && data.length > 0) {
      const msg = data[data.length - 1]
      // 支持 H5 发送 { action: 'setTitle', title: 'xxx' }
      if (msg.action === 'setTitle' && msg.title) {
        wx.setNavigationBarTitle({ title: msg.title })
      }
      // 支持 H5 发送 { action: 'navigateBack' }
      if (msg.action === 'navigateBack') {
        wx.navigateBack()
      }
    }
  },

  onLoad_web_error() {},
  onError(e) {
    console.error('webview load error', e.detail)
    wx.showToast({ title: '页面加载失败', icon: 'none' })
  }
})
