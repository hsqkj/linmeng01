/**
 * 商家端 - 资源管理
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    resources: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    statusIndex: 0,
    statusOptions: ['全部', '已发布', '待审核', '已下架']
  },

  onLoad() {
    this.loadResources()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadResources(true)
    }
  },

  loadResources(isLoadMore = false) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/merchant/my/resources`,
      method: 'GET',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = res.data.data?.list || res.data.data || []
          this.setData({
            resources: isLoadMore ? [...this.data.resources, ...list] : list,
            hasMore: list.length >= this.data.pageSize
          })
        }
      },
      complete: () => this.setData({ loading: false })
    })
  },

  onStatusChange(e) {
    this.setData({ statusIndex: e.detail.value, page: 1 })
    this.loadResources()
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/merchant/publish/publish' })
  },

  editResource(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/publish/publish?id=${id}` })
  },

  deleteResource(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条资源吗？',
      success: res => {
        if (res.confirm) {
          const token = wx.getStorageSync('token')
          wx.request({
            url: `${apiBase}/merchant/resources/${id}`,
            method: 'DELETE',
            header: { Authorization: `Bearer ${token}` },
            success: r => {
              if (r.data.code === 200 || r.data.code === 0) {
                wx.showToast({ title: '删除成功', icon: 'success' })
                this.setData({ page: 1, resources: [] })
                this.loadResources()
              }
            }
          })
        }
      }
    })
  }
})
