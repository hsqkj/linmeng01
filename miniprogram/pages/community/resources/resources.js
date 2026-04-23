/**
 * 资源广场
 */
const app = getApp()

Page({
  data: {
    resources: [],
    categories: [], // 从 API 动态加载
    currentCategory: -1,
    keyword: '',
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false,
    refreshing: false
  },

  onLoad(options) {
    // 加载资源类型分类
    this.loadCategories()
    // 加载资源列表
    this.loadResources()
  },

  onShow() {
    // 刷新收藏状态
    this.refreshFavoriteStatus()
  },

  // 加载资源类型分类
  loadCategories() {
    app.request({
      url: '/community/basic-info',
      method: 'GET'
    }).then(data => {
      if (data.resourceTypes && data.resourceTypes.length > 0) {
        // 资源类型数组转分类列表（保持索引对应 ID）
        this.setData({ categories: data.resourceTypes })
      }
    }).catch(err => {
      console.error('加载资源类型失败', err)
    })
  },

  // 加载资源列表
  loadResources() {
    const that = this
    const { page, pageSize, keyword, currentCategory, categories } = this.data
    
    if (this.data.loading || this.data.noMore) return
    
    this.setData({ loading: true })
    
    const type = currentCategory >= 0 ? currentCategory : ''
    
    app.request({
      url: '/community/resources',
      data: {
        page,
        pageSize,
        keyword,
        type
      }
    }).then(data => {
      const newResources = data.list || data || []
      const resources = page === 1 ? newResources : [...that.data.resources, ...newResources]
      
      that.setData({
        resources,
        loading: false,
        noMore: newResources.length < pageSize,
        refreshing: false
      })
    }).catch(err => {
      that.setData({ loading: false, refreshing: false })
    })
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ page: 1, noMore: false, refreshing: true })
    this.loadResources()
  },

  // 加载更多
  loadMore() {
    if (!this.data.noMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadResources()
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 搜索确认
  onSearch() {
    this.setData({ page: 1, noMore: false })
    this.loadResources()
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id)
    this.setData({
      currentCategory: categoryId,
      page: 1,
      noMore: false
    })
    this.loadResources()
  },

  // 跳转详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/community/resource-detail/resource-detail?id=${id}` })
  },

  // 切换收藏
  toggleFavorite(e) {
    const that = this
    const { id } = e.currentTarget.dataset
    const token = wx.getStorageSync('token')
    
    if (!token) {
      wx.navigateTo({ url: '/pages/community/login/login' })
      return
    }

    app.request({
      url: '/community/toggleFavorite',
      method: 'POST',
      data: { resourceId: id }
    }).then(() => {
      // 刷新列表中该项的收藏状态
      const resources = that.data.resources.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isFavorited: !item.isFavorited,
            favorite_count: (item.favorite_count || 0) + (item.isFavorited ? -1 : 1)
          }
        }
        return item
      })
      that.setData({ resources })
    }).catch(() => {})
  },

  // 分享资源
  shareResource(e) {
    const { id } = e.currentTarget.dataset
    const resource = this.data.resources.find(r => r.id === id)
    
    if (resource) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
  },

  // 刷新收藏状态
  refreshFavoriteStatus() {
    const that = this
    const favorites = wx.getStorageSync('favoriteIds') || []
    
    const resources = this.data.resources.map(item => ({
      ...item,
      isFavorited: favorites.includes(item.id)
    }))
    
    this.setData({ resources })
  }
})
