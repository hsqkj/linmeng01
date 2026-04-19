/**
 * 招商大使端首页
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    ambData: {},
    recentMerchants: [],
    monthCommission: 0,
    commissionConfig: {},
    loading: false,
    ambassadorLevel: null,
    monthlyData: [
      { month: '11月', commission: 0 },
      { month: '12月', commission: 0 },
      { month: '1月', commission: 0 },
      { month: '2月', commission: 0 },
      { month: '3月', commission: 0 },
      { month: '4月', commission: 0 }
    ]
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (app.globalData.token && app.globalData.userType === 'ambassador') {
      this.loadData()
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'ambassador') {
      wx.reLaunch({ url: '/pages/ambassador/login/login' })
      return
    }
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    const token = wx.getStorageSync('token')
    const header = { Authorization: `Bearer ${token}` }

    try {
      // 并行加载
      const [homeRes, configRes] = await Promise.all([
        this.request('/ambassador/home', {}, header),
        this.request('/ambassador/commission/config', {}, header)
      ])

      // 首页数据
      if (homeRes.data) {
        const d = homeRes.data
        this.setData({
          ambData: d,
          recentMerchants: d.recentMerchants || [],
          monthCommission: d.monthCommission || 0
        })
      }

      // 提成配置
      if (configRes.data) {
        this.setData({
          commissionConfig: configRes.data,
          ambassadorLevel: configRes.data.ambassador_levels ? 
            configRes.data.ambassador_levels[0] : { name: '主管级', commissionRate: 25 }
        })
      }

    } catch (err) {
      console.error('加载数据失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  request(url, data = {}, header = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method: 'GET',
        data,
        header: { 'Content-Type': 'application/json', ...header },
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

  // 跳转二维码
  goQrcode() {
    wx.navigateTo({ url: '/pages/ambassador/qrcode/qrcode' })
  },

  // 跳转发展记录
  goRecords() {
    wx.navigateTo({ url: '/pages/ambassador/records/records' })
  },

  // 跳转佣金明细
  goCommission() {
    wx.navigateTo({ url: '/pages/ambassador/commission/commission' })
  },

  // 跳转提现
  goWithdraw() {
    wx.navigateTo({ url: '/pages/ambassador/withdraw/withdraw' })
  },

  // 跳转个人中心
  goProfile() {
    wx.navigateTo({ url: '/pages/ambassador/profile/profile' })
  },

  // 跳转我的社区
  goCommunities() {
    wx.navigateTo({ url: '/pages/ambassador/communities/communities' })
  },

  // 跳转商家管理
  goMerchants() {
    wx.navigateTo({ url: '/pages/ambassador/merchants/merchants' })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({ url: '/pages/ambassador/login/login' })
        }
      }
    })
  },

  // 格式化金额
  fmtMoney(v) {
    if (!v) return '0'
    return Number(v).toLocaleString()
  },

  // 获取状态标签类型
  getStatusType(status) {
    const types = { 0: 'warning', 1: 'success', 2: 'info' }
    return types[status] || 'info'
  },

  // 获取状态标签文字
  getStatusLabel(status) {
    const labels = { 0: '待审核', 1: '已缴费', 2: '禁用' }
    return labels[status] || '未知'
  }
})
