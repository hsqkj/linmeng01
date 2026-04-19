/**
 * 大使端 - 佣金明细
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    summary: {},
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadRecords(true)
    }
  },

  async loadData() {
    this.setData({ loading: true })
    const token = wx.getStorageSync('token')
    const header = { Authorization: `Bearer ${token}` }

    try {
      const [summaryRes, recordsRes] = await Promise.all([
        this.request('/ambassador/commission/summary', {}, header),
        this.request('/ambassador/commission', { page: 1, pageSize: this.data.pageSize }, header)
      ])

      if (summaryRes.data) this.setData({ summary: summaryRes.data })
      if (recordsRes.data) {
        const list = Array.isArray(recordsRes.data) ? recordsRes.data : recordsRes.data.list || []
        this.setData({
          records: list,
          hasMore: list.length >= this.data.pageSize
        })
      }
    } catch (err) {
      console.error('加载失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  loadRecords(isLoadMore = false) {
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/ambassador/commission`,
      method: 'GET',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.list || []
          this.setData({
            records: isLoadMore ? [...this.data.records, ...list] : list,
            hasMore: list.length >= this.data.pageSize
          })
        }
      }
    })
  },

  request(url, data = {}, header = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method: 'GET',
        data,
        header: { 'Content-Type': 'application/json', ...header },
        success: resolve,
        fail: reject
      })
    })
  }
})
