/**
 * 商家端收益管理
 */
const app = getApp()

Page({
  data: {
    summary: {
      total: 0,
      withdrawable: 0,
      withdrawn: 0
    },
    records: []
  },

  onLoad() {
    this.checkLogin()
    this.loadData()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'merchant') {
      wx.redirectTo({ url: '/pages/merchant/login/login' })
    }
  },

  loadData() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.apiBase}/merchant/income`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: res => {
        if (res.data.code === 0) {
          this.setData({
            summary: res.data.data.summary,
            records: res.data.data.records || []
          })
        }
      }
    })
  },

  withdraw() {
    wx.navigateTo({ url: '/pages/merchant/withdraw/withdraw' })
  }
})
