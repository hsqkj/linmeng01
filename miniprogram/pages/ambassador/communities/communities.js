/**
 * 大使端 - 我的社区
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    communities: [],
    loading: false
  },

  onLoad() {
    this.loadCommunities()
  },

  loadCommunities() {
    this.setData({ loading: true })
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/ambassador/communities`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          this.setData({ communities: res.data.data || [] })
        }
      },
      complete: () => this.setData({ loading: false })
    })
  },

  addCommunity() {
    wx.showToast({ title: '添加社区功能开发中', icon: 'none' })
  }
})
