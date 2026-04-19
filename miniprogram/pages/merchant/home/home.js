/**
 * 商家端首页
 */
const app = getApp()

Page({
  data: {
    userInfo: {},
    profile: {},
    stats: {
      resources: 0,
      intentions: 0,
      completed: 0,
      totalDemands: 0,
      totalResources: 0
    },
    demands: [],
    banners: [],
    loading: false,
    memberLevelName: '普通会员',
    // 调试信息
    apiUrl: '',
    hasToken: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 每次显示页面时从 storage 获取最新 token
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    
    // 更新全局变量
    if (token) {
      app.globalData.token = token
      app.globalData.userType = userType
    }
    
    if (token && userType === 'merchant') {
      this.loadData()
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'merchant') {
      wx.reLaunch({ url: '/pages/merchant/login/login' })
      return
    }
    // 更新全局变量
    app.globalData.token = token
    app.globalData.userType = userType
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    const apiBase = app.globalData.apiBase || 'http://150.158.12.243/api'
    const token = wx.getStorageSync('token')
    
    // 设置调试信息
    this.setData({
      apiUrl: apiBase + '/merchant/home',
      hasToken: !!token
    })
    
    console.log('开始加载数据...')
    console.log('API地址:', apiBase)
    console.log('Token:', token ? '有' : '无')
    
    if (!token) {
      wx.showToast({ title: '未登录，请先登录', icon: 'none' })
      wx.reLaunch({ url: '/pages/merchant/login/login' })
      return
    }
    
    const header = { Authorization: `Bearer ${token}` }

    try {
      // 商家首页数据
      const homeRes = await this.request(`${apiBase}/merchant/home`, {}, header)
      console.log('商家首页数据:', homeRes)

      if (homeRes.data) {
        const homeData = homeRes.data
        this.setData({
          userInfo: homeData,
          stats: {
            resources: homeData.resourceCount || 0,
            intentions: homeData.intentionCount || 0,
            completed: homeData.completedCount || 0,
            totalDemands: homeRes.data.totalDemands || 0,
            totalResources: homeRes.data.totalResources || 0
          },
          memberLevelName: this.getMemberLevelName(homeData.member_level)
        })
      }

      // 推荐需求
      try {
        const recommendRes = await this.request(`${apiBase}/merchant/recommend/demands`, { page: 1, pageSize: 5 }, header)
        console.log('推荐需求:', recommendRes)
        const demandsList = Array.isArray(recommendRes.data) ? recommendRes.data : 
                          (recommendRes.data?.data?.list || recommendRes.data?.data || [])
        this.setData({ demands: demandsList })
      } catch (e) {
        console.log('推荐需求加载失败:', e)
      }

    } catch (err) {
      console.error('加载数据失败', err)
      wx.showToast({ title: '加载失败: ' + (err.msg || '网络错误'), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 封装请求方法
  request(url, data = {}, header = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'GET',
        data,
        header: { 'Content-Type': 'application/json', ...header },
        success: res => {
          console.log('API响应:', url, res.data)
          if (res.data.code === 200 || res.data.code === 0) {
            resolve(res.data)
          } else {
            reject(res.data)
          }
        },
        fail: err => {
          console.error('请求失败:', url, err)
          reject(err)
        }
      })
    })
  },

  getMemberLevelName(level) {
    const levels = { 0: '免费试用', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }
    return levels[level] || '普通会员'
  },

  // 跳转到发布资源
  goPublish() {
    wx.navigateTo({ url: '/pages/merchant/publish/publish' })
  },

  // 跳转到资源管理
  goResources() {
    wx.navigateTo({ url: '/pages/merchant/resources/resources' })
  },

  // 跳转到需求大厅
  goDemands() {
    wx.navigateTo({ url: '/pages/merchant/demands/demands' })
  },

  // 跳转到会员中心
  goMember() {
    wx.navigateTo({ url: '/pages/merchant/member/member' })
  },

  // 跳转到个人中心
  goProfile() {
    wx.navigateTo({ url: '/pages/merchant/profile/profile' })
  },

  // 查看需求详情
  viewDemand(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/merchant/demand-detail/demand-detail?id=${id}` })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({ url: '/pages/merchant/login/login' })
        }
      }
    })
  }
})
