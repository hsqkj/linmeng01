/**
 * 商家端资源详情页
 */
const app = getApp()

Page({
  data: {
    loading: true,
    resource: {},
    resourceTypeName: '资源',
    statusName: '未知',
    tags: [],
    images: [],
    expectedRewards: [],
    comments: [],
    replyText: '',
    replyLoading: false,
    hearts: []
  },

  resourceId: null,

  onLoad(options) {
    this.resourceId = options.id
    if (this.resourceId) {
      this.loadResource()
      this.loadComments()
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
    }
  },

  // 状态映射
  statusMap: { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '已下架' },

  // 领取方式映射
  pickupWayMap: { delivery: '可配送', pickup: '自取', both: '均可' },

  // 收费标准映射
  priceRangeMap: { free: '免费', discount: '优惠价', market: '市场价' },

  request(url, data = {}, method = 'GET', header = {}) {
    const apiBase = app.globalData.apiBase || 'http://150.158.12.243/api'
    const token = wx.getStorageSync('token')
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...header
        },
        success: res => {
          if (res.data.code === 200 || res.data.code === 0) {
            resolve(res.data)
          } else {
            reject(res.data)
          }
        },
        fail: reject
      })
    })
  },

  async loadResource() {
    try {
      const res = await this.request(`/merchant/resources/${this.resourceId}`)
      const data = res.data || {}

      // 解析标签
      let tags = []
      if (data.tags) {
        if (Array.isArray(data.tags)) {
          tags = data.tags
        } else if (typeof data.tags === 'string') {
          try { tags = JSON.parse(data.tags) } catch { tags = [] }
        }
      }

      // 解析图片
      let images = []
      if (data.images) {
        if (Array.isArray(data.images)) {
          images = data.images
        } else if (typeof data.images === 'string') {
          try { images = JSON.parse(data.images) } catch { images = [] }
        }
      }

      // 解析期望回报
      let expectedRewards = []
      if (data.expected_rewards) {
        if (Array.isArray(data.expected_rewards)) {
          expectedRewards = data.expected_rewards
        } else if (typeof data.expected_rewards === 'string') {
          try { expectedRewards = JSON.parse(data.expected_rewards) } catch { expectedRewards = [] }
        }
      }

      // 资源类型名称（优先使用后端返回的名称）
      const resourceTypeName = data.resource_type_name || '资源'

      // 状态名称
      const statusName = this.statusMap[data.status] || '未知'

      // 爱心表情
      const hearts = []
      const heartCount = data.match_hearts || 0
      for (let i = 0; i < 5; i++) {
        hearts.push(i < heartCount ? '❤️' : '🤍')
      }

      this.setData({
        loading: false,
        resource: data,
        resourceTypeName,
        statusName,
        tags,
        images,
        expectedRewards,
        hearts
      })
    } catch (err) {
      console.error('加载资源失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  async loadComments() {
    try {
      const res = await this.request(`/merchant/resources/${this.resourceId}/comments`)
      const comments = (res.data || []).map(c => ({
        id: c.id,
        name: c.user_name || '社区用户',
        avatar: c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '社区')}&background=409EFF&color=fff`,
        time: this.formatTime(c.created_at),
        text: c.content
      }))
      this.setData({ comments })
    } catch (err) {
      console.error('加载留言失败', err)
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${month} ${hour}:${minute}`
  },

  goBack() {
    wx.navigateBack()
  },

  editResource() {
    wx.navigateTo({
      url: `/pages/merchant/edit-resource/edit-resource?id=${this.resourceId}`
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  onReplyInput(e) {
    this.setData({ replyText: e.detail.value })
  },

  submitReply() {
    if (!this.data.replyText.trim()) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' })
      return
    }
    if (this.data.comments.length === 0) {
      wx.showToast({ title: '暂无留言可回复', icon: 'none' })
      return
    }

    this.setData({ replyLoading: true })
    const lastComment = this.data.comments[this.data.comments.length - 1]

    this.request(`/community/comments/${lastComment.id}/reply`, {
      content: this.data.replyText
    }, 'POST')
      .then(() => {
        wx.showToast({ title: '回复成功', icon: 'success' })
        this.setData({ replyText: '' })
        this.loadComments()
      })
      .catch(err => {
        wx.showToast({ title: err.msg || '回复失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ replyLoading: false })
      })
  }
})
