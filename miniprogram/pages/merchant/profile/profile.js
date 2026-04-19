/**
 * 商家端个人中心
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
    if (app.globalData.token && wx.getStorageSync('userType') === 'merchant') {
      this.loadData()
    }
  },

  // 检查登录
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'merchant') {
      wx.redirectTo({ url: '/pages/merchant/login/login' })
    } else {
      this.setData({ userInfo: app.globalData.userInfo })
    }
  },

  // 加载数据
  loadData() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.apiBase}/merchant/profile`,
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
    wx.navigateTo({ url: '/pages/merchant/profile/edit' })
  },

  // 我的资源
  myResources() {
    wx.navigateTo({ url: '/pages/merchant/resources/resources' })
  },

  // 订单管理
  myOrders() {
    wx.navigateTo({ url: '/pages/merchant/orders/orders' })
  },

  // 收益管理
  myIncome() {
    wx.navigateTo({ url: '/pages/merchant/income/income' })
  },

  // 会员中心
  memberCenter() {
    wx.navigateTo({ url: '/pages/merchant/member/member' })
  },

  // 设置
  settings() {
    wx.navigateTo({ url: '/pages/merchant/settings/settings' })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.redirectTo({ url: '/pages/merchant/login/login' })
        }
      }
    })
  }
})
