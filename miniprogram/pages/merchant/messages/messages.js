/**
 * 商家端消息中心
 */
const app = getApp()

Page({
  data: {
    activeTab: 'intentions',
    loading: false,
    // 合作意向
    intentions: [],
    intentionUnread: 0,
    intentionPage: 1,
    intentionTotal: 0,
    // 留言咨询
    comments: [],
    commentUnread: 0,
    // 系统通知
    systemMessages: [],
    systemUnread: 0
  },

  statusName: { 0: '待回复', 1: '已接受', 2: '已拒绝', 3: '已完成' },
  pageSize: 10,

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新当前标签
    this.loadData()
  },

  request(url, data = {}, method = 'GET') {
    const apiBase = app.globalData.apiBase || 'http://150.158.12.243/api'
    const token = wx.getStorageSync('token')
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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

  loadData() {
    if (this.data.activeTab === 'intentions') {
      this.loadIntentions()
    } else if (this.data.activeTab === 'comments') {
      this.loadComments()
    } else if (this.data.activeTab === 'system') {
      this.loadSystemMessages()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadData()
  },

  // 合作意向
  async loadIntentions() {
    this.setData({ loading: true })
    try {
      const res = await this.request('/merchant/intentions', {
        page: this.data.intentionPage,
        pageSize: this.pageSize
      })
      const list = res.data?.list || res.data || []
      const intentions = list.map(item => ({
        ...item,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.community_name || '社区')}&background=4A90D9&color=fff&size=64`,
        time: this.formatTime(item.created_at)
      }))
      this.setData({
        intentions,
        intentionTotal: res.data?.total || 0
      })
    } catch (err) {
      console.error('加载意向失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  viewDemand(e) {
    const item = e.currentTarget.dataset.item
    if (item.demand_id) {
      wx.navigateTo({
        url: `/pages/merchant/demand-detail/demand-detail?id=${item.demand_id}`
      })
    }
  },

  // 留言咨询
  async loadComments() {
    this.setData({ loading: true })
    try {
      // 先获取商家自己的资源
      const res = await this.request('/merchant/my/resources', { page: 1, pageSize: 100 })
      const resources = res.data?.list || res.data || []
      
      // 获取每个资源的留言
      const allComments = []
      for (const r of resources) {
        try {
          const cr = await this.request(`/merchant/resources/${r.id}/comments`)
          const comments = Array.isArray(cr.data) ? cr.data : []
          comments.forEach(c => {
            allComments.push({
              ...c,
              name: c.user_name || '社区用户',
              avatar: c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '社区')}&background=409EFF&color=fff&size=64`,
              time: this.formatTime(c.created_at),
              text: c.content,
              resource_title: r.title,
              replies: c.replies || []
            })
          })
        } catch {}
      }
      
      // 按时间倒序
      allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      this.setData({ comments: allComments })
    } catch (err) {
      console.error('加载留言失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  replyComment(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '回复留言',
      placeholderText: '请输入回复内容',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await this.request(`/community/comments/${item.id}/reply`, {
              content: res.content
            }, 'POST')
            wx.showToast({ title: '回复成功', icon: 'success' })
            this.loadComments()
          } catch (err) {
            wx.showToast({ title: '回复失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 系统通知
  async loadSystemMessages() {
    this.setData({ loading: true })
    try {
      const res = await this.request('/merchant/notifications', {
        page: 1,
        pageSize: 50
      })
      const messages = (res.data?.list || res.data || []).map((msg, idx) => ({
        id: msg.id || idx,
        title: msg.title || '系统通知',
        content: msg.content || msg.message || '',
        tag: msg.tag || this.getTagFromType(msg.type),
        tagClass: this.getTagClassFromType(msg.type),
        time: this.formatTime(msg.created_at || msg.create_time),
        is_read: msg.is_read || msg.status === 1
      }))
      this.setData({
        systemMessages: messages,
        systemUnread: messages.filter(m => !m.is_read).length
      })
    } catch (err) {
      console.error('加载通知失败', err)
      this.setData({ systemMessages: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  getTagFromType(type) {
    const map = { 1: '审核通知', 2: '意向提醒', 3: '系统公告', 4: '活动通知', default: '通知' }
    return map[type] || map.default
  },

  getTagClassFromType(type) {
    const map = { 1: 'tag-info', 2: 'tag-warning', 3: 'tag-success', 4: 'tag-primary', default: 'tag-default' }
    return map[type] || map.default
  },

  clickNotification(e) {
    const item = e.currentTarget.dataset.item
    if (!item.is_read) {
      item.is_read = true
      this.setData({ systemMessages: this.data.systemMessages })
    }
  },

  formatTime(time) {
    if (!time) return ''
    const d = new Date(time)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  goBack() {
    wx.navigateBack()
  }
})
