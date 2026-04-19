/**
 * 社区端个人中心
 */
const app = getApp()

Page({
  data: {
    userInfo: null,
    profile: {
      stats: {}
    }
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userInfo })
  },

  onShow() {
    this.loadProfile()
  },

  // 加载个人资料
  loadProfile() {
    const that = this
    const token = wx.getStorageSync('token')
    
    if (!token) {
      wx.navigateTo({ url: '/pages/community/login/login' })
      return
    }

    app.request({
      url: '/community/profile'
    }).then(data => {
      that.setData({ profile: data })
      wx.setStorageSync('communityInfo', {
        community: data.community,
        district: data.district,
        street: data.street
      })
    }).catch(() => {})
  },

  // 编辑个人资料
  goEditProfile() {
    wx.navigateTo({ url: '/pages/community/edit-profile/edit-profile' })
  },

  // 我的需求
  goMyDemands() {
    wx.navigateTo({ url: '/pages/community/my-demands/my-demands' })
  },

  // 我的发布
  goMyResources() {
    wx.navigateTo({ url: '/pages/community/my-resources/my-resources' })
  },

  // 我的收藏
  goFavorites() {
    wx.navigateTo({ url: '/pages/community/favorites/favorites' })
  },

  // 我的奖励
  goRewards() {
    wx.navigateTo({ url: '/pages/community/rewards/rewards' })
  },

  // 场地管理
  goSpaces() {
    wx.navigateTo({ url: '/pages/community/spaces/spaces' })
  },

  // 关于我们
  goAbout() {
    wx.navigateTo({ url: '/pages/webview/webview?type=about' })
  },

  // 联系客服
  showService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888',
      showCancel: false
    })
  },

  // 设置
  showSettings() {
    wx.showActionSheet({
      itemList: ['修改密码', '清除缓存', '检查更新'],
      success: res => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/community/change-password/change-password' })
        } else if (res.tapIndex === 1) {
          wx.showLoading({ title: '清除中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '清除成功', icon: 'success' })
          }, 1000)
        }
      }
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.isLoggedIn = false
          app.globalData.userInfo = null
          app.globalData.token = ''
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    })
  }
})
