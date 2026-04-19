/**
 * 大使端 - 商家管理
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    merchants: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadMerchants()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadMerchants(true)
    }
  },

  loadMerchants(isLoadMore = false) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/ambassador/merchants`,
      method: 'GET',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = res.data.data?.list || res.data.data || []
          this.setData({
            merchants: isLoadMore ? [...this.data.merchants, ...list] : list,
            hasMore: list.length >= this.data.pageSize
          })
        }
      },
      complete: () => this.setData({ loading: false })
    })
  }
})
