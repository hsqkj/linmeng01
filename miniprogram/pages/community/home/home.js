/**
 * 社区端首页
 */
const app = getApp()

Page({
  data: {
    userInfo: null,
    communityInfo: {},
    stats: {},
    recommendResources: [],
    recentDemands: []
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadHomeData()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const communityInfo = wx.getStorageSync('communityInfo') || {}
    
    this.setData({
      userInfo,
      communityInfo
    })
  },

  // 加载首页数据
  loadHomeData() {
    const that = this
    
    // 获取用户统计
    app.request({
      url: '/community/myStats'
    }).then(data => {
      that.setData({ stats: data })
    }).catch(() => {})

    // 获取推荐资源
    app.request({
      url: '/community/recommendResources',
      data: { limit: 5 }
    }).then(data => {
      that.setData({ recommendResources: data })
    }).catch(() => {})

    // 获取最新需求
    app.request({
      url: '/community/recentDemands',
      data: { limit: 5 }
    }).then(data => {
      that.setData({ recentDemands: data })
    }).catch(() => {})
  },

  // 跳转到发布需求（H5 webview）
  goPublishDemand() {
    this.checkLogin(() => {
      const path = encodeURIComponent('/#/community/demands/publish')
      wx.navigateTo({ url: `/pages/community/webview/webview?path=${path}&title=${encodeURIComponent('发布需求')}` })
    })
  },

  // 跳转到我的需求（H5 webview）
  goMyDemands() {
    this.checkLogin(() => {
      const path = encodeURIComponent('/#/community/demands')
      wx.navigateTo({ url: `/pages/community/webview/webview?path=${path}&title=${encodeURIComponent('我的需求')}` })
    })
  },

  // 跳转到资源广场（小程序原生页面）
  goResources() {
    wx.navigateTo({ url: '/pages/community/resources/resources' })
  },

  // 跳转到我的收藏
  goFavorites() {
    this.checkLogin(() => {
      wx.navigateTo({ url: '/pages/community/favorites/favorites' })
    })
  },

  // 跳转到资源详情
  goResourceDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/community/resource-detail/resource-detail?id=${id}` })
  },

  // 跳转到需求详情（H5 webview）
  goDemandDetail(e) {
    const { id } = e.currentTarget.dataset
    const path = encodeURIComponent(`/#/community/demands/${id}`)
    wx.navigateTo({ url: `/pages/community/webview/webview?path=${path}&title=${encodeURIComponent('需求详情')}` })
  },

  // 检查登录
  checkLogin(callback) {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.navigateTo({ url: '/pages/community/login/login' })
      return false
    }
    callback && callback()
    return true
  }
})
