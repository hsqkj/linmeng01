/**
 * 商家端订单管理
 */
const app = getApp()

Page({
  data: {
    orders: [],
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.checkLogin()
    this.loadOrders()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadMore()
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'merchant') {
      wx.redirectTo({ url: '/pages/merchant/login/login' })
    }
  },

  loadOrders() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.apiBase}/merchant/orders`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      data: { page: 1 },
      success: res => {
        if (res.data.code === 0) {
          this.setData({
            orders: res.data.data.list || [],
            hasMore: res.data.data.hasMore,
            page: 1
          })
        }
      }
    })
  },

  loadMore() {
    const app = getApp()
    const nextPage = this.data.page + 1
    wx.request({
      url: `${app.globalData.apiBase}/merchant/orders`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      data: { page: nextPage },
      success: res => {
        if (res.data.code === 0) {
          this.setData({
            orders: [...this.data.orders, ...(res.data.data.list || [])],
            hasMore: res.data.data.hasMore,
            page: nextPage
          })
        }
      }
    })
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/order-detail/order-detail?id=${id}` })
  }
})
