/**
 * 大使端 - 发展记录
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    records: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadRecords()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadRecords(true)
    }
  },

  loadRecords(isLoadMore = false) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/ambassador/records`,
      method: 'GET',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = res.data.data || []
          this.setData({
            records: isLoadMore ? [...this.data.records, ...list] : list,
            hasMore: list.length >= this.data.pageSize
          })
        }
      },
      complete: () => this.setData({ loading: false })
    })
  },

  viewMerchant(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/ambassador/merchants/merchants` })
  }
})
