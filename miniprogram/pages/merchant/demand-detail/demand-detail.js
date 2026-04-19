/**
 * 商家端 - 需求详情页
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    demand: null,
    loading: true,
    favorited: false,
    comments: [],
    page: 1,
    pageSize: 10,
    hasMoreComments: true,
    loadingComments: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadDemand(options.id)
      this.loadComments(options.id)
    }
  },

  loadDemand(id) {
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/merchant/demands/${id}`,
      method: 'GET',
      header: { Authorization: token ? `Bearer ${token}` : {} },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const data = res.data.data
          // 解析 tags
          if (data.tags && typeof data.tags === 'string') {
            try {
              data.tags = JSON.parse(data.tags)
            } catch (e) {
              data.tags = data.tags.split(',').filter(t => t.trim())
            }
          }
          // 解析 images
          if (data.images && typeof data.images === 'string') {
            try {
              data.images = JSON.parse(data.images)
            } catch (e) {
              data.images = []
            }
          }
          this.setData({ 
            demand: data,
            loading: false,
            favorited: data.favorited || false
          })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  loadComments(id, isLoadMore = false) {
    if (this.data.loadingComments) return
    this.setData({ loadingComments: true })
    
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/merchant/comments/demand/${id}`,
      method: 'GET',
      data: { page: this.data.page, pageSize: this.data.pageSize },
      header: { Authorization: token ? `Bearer ${token}` : {} },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          const list = res.data.data?.list || res.data.data || []
          this.setData({
            comments: isLoadMore ? [...this.data.comments, ...list] : list,
            hasMoreComments: list.length >= this.data.pageSize
          })
        }
      },
      complete: () => {
        this.setData({ loadingComments: false })
      }
    })
  },

  onReachBottom() {
    if (this.data.hasMoreComments) {
      this.setData({ page: this.data.page + 1 })
      this.loadComments(this.data.demand.id, true)
    }
  },

  // 解析标签
  parseTags(tags) {
    if (!tags) return []
    if (Array.isArray(tags)) return tags
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags)
      } catch (e) {
        return tags.split(',').map(t => t.trim()).filter(t => t)
      }
    }
    return []
  },

  // 解析商家回报
  parseRewards(reward) {
    if (!reward) return []
    if (Array.isArray(reward)) return reward
    if (typeof reward === 'string') {
      try {
        return JSON.parse(reward)
      } catch (e) {
        return reward.split(',').map(r => r.trim()).filter(r => r)
      }
    }
    return []
  },

  // 收藏/取消收藏
  toggleFavorite() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    wx.request({
      url: `${apiBase}/merchant/favorites/toggle`,
      method: 'POST',
      data: { demand_id: this.data.demand.id },
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          this.setData({ favorited: !this.data.favorited })
          wx.showToast({ 
            title: this.data.favorited ? '已收藏' : '已取消收藏', 
            icon: 'success' 
          })
        }
      }
    })
  },

  // 分享
  onShareAppMessage() {
    const { demand } = this.data
    return {
      title: demand?.title || '社区需求',
      path: `/pages/merchant/demand-detail/demand-detail?id=${demand?.id}`
    }
  },

  onShare() {
    // 小程序分享
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.demand.images || []
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 留言
  goComment() {
    wx.navigateTo({
      url: `/pages/merchant/comment/comment?demandId=${this.data.demand.id}`
    })
  },

  // 查看社区详情
  viewCommunity() {
    if (this.data.demand?.community_id) {
      wx.navigateTo({
        url: `/pages/merchant/community-detail/community-detail?id=${this.data.demand.community_id}`
      })
    }
  }
})
