/**
 * 商家端 - 需求大厅
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    demands: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    searchKey: '',
    typeIndex: 0,
    types: ['全部', '物资捐赠', '资金赞助', '活动赞助', '志愿服务', '专业服务']
  },

  onLoad() {
    this.loadDemands()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 })
      this.loadDemands(true)
    }
  },

  loadDemands(isLoadMore = false) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    // 类型映射：全部/物资捐赠/资金赞助/活动赞助/志愿服务/专业服务
    const typeMap = ['', 3, 5, 8, 4, 1]
    const type = this.data.typeIndex > 0 ? typeMap[this.data.typeIndex] : ''
    
    wx.request({
      url: `${apiBase}/merchant/demands`,
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize,
        keyword: this.data.searchKey,
        type: type
      },
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = res.data.data?.list || res.data.data || []
          this.setData({
            demands: isLoadMore ? [...this.data.demands, ...list] : list,
            hasMore: list.length >= this.data.pageSize
          })
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value, page: 1 })
    this.loadDemands()
  },

  viewDemand(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/demand-detail/demand-detail?id=${id}` })
  },

  onTypeChange(e) {
    const index = e.currentTarget.dataset.index !== undefined 
      ? e.currentTarget.dataset.index 
      : e.detail.value
    this.setData({ typeIndex: index, page: 1 })
    this.loadDemands()
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})
