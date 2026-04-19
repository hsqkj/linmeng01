/**
 * 招商大使端个人中心
 */
const app = getApp()

Page({
  data: {
    userInfo: null,
    memberInfo: null
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (app.globalData.token && wx.getStorageSync('userType') === 'ambassador') {
      this.loadData()
    }
  },

  // 检查登录
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'ambassador') {
      wx.redirectTo({ url: '/pages/ambassador/login/login' })
    } else {
      this.setData({ userInfo: app.globalData.userInfo })
    }
  },

  // 加载数据
  loadData() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.apiBase}/ambassador/profile`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: res => {
        if (res.data.code === 0) {
          this.setData({
            userInfo: res.data.data.userInfo,
            memberInfo: res.data.data.memberInfo
          })
        }
      }
    })
  },

  // 跳转页面
  navigateTo(url) {
    wx.navigateTo({ url })
  },

  // 编辑资料
  editProfile() {
    wx.navigateTo({ url: '/pages/ambassador/profile/edit' })
  },

  // 我的社区
  myCommunities() {
    wx.navigateTo({ url: '/pages/ambassador/communities/communities' })
  },

  // 商家管理
  merchantManage() {
    wx.navigateTo({ url: '/pages/ambassador/merchants/merchants' })
  },

  // 我的佣金
  myCommission() {
    wx.navigateTo({ url: '/pages/ambassador/commission/commission' })
  },

  // 数据报表
  myReport() {
    wx.navigateTo({ url: '/pages/ambassador/report/report' })
  },

  // 设置
  settings() {
    wx.navigateTo({ url: '/pages/ambassador/settings/settings' })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.redirectTo({ url: '/pages/ambassador/login/login' })
        }
      }
    })
  }
})
