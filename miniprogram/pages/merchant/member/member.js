/**
 * 商家端会员中心
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    memberInfo: null,
    memberLevel: 0,
    memberLevels: [],
    expireDate: '',
    benefits: [],
    payments: [],
    loading: true
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.loadData()
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (!token || userType !== 'merchant') {
      wx.redirectTo({ url: '/pages/merchant/login/login' })
    } else {
      this.loadData()
    }
  },

  loadData() {
    const token = wx.getStorageSync('token')
    if (!token) return

    this.setData({ loading: true })

    // 并行加载会员信息和等级配置
    Promise.all([
      this.request('/merchant/member'),
      this.request('/merchant/member/levels'),
      this.request('/merchant/member/payments')
    ]).then(([memberRes, levelsRes, paymentsRes]) => {
      const memberData = memberRes.data || {}
      const levelsData = levelsRes.data?.levels || []
      const paymentsData = paymentsRes.data || []

      // 等级名称映射
      const levelNames = ['免费试用', '普通会员', '银牌会员', '金牌会员', '铂金会员', '钻石会员']
      const levelColors = ['#909399', '#409EFF', '#C0C0C0', '#E6A23C', '#909399', '#F56C6C']
      const currentLevel = memberData.member_level || 0

      // 构建会员等级列表
      const memberLevelsList = levelsData.map(lv => ({
        level: lv.level,
        name: lv.name || levelNames[lv.level] || 'Lv' + lv.level,
        fee: lv.fee || 0,
        current: lv.level === currentLevel,
        color: levelColors[lv.level] || '#409EFF',
        benefits: lv.benefits || []
      }))

      // 格式化缴费记录
      const payments = paymentsData.map(p => ({
        time: p.time || p.created_at,
        level: levelNames[p.level] || 'Lv' + p.level,
        amount: p.amount || 0,
        validUntil: p.validUntil || p.end_date,
        ambassador: p.ambassador || '-',
        status: p.status === 1 ? '已支付' : '待支付'
      }))

      this.setData({
        loading: false,
        memberInfo: memberData,
        memberLevel: currentLevel,
        memberLevels: memberLevelsList,
        expireDate: memberData.expire_date || '长期有效',
        payments: payments
      })
    }).catch(err => {
      console.error('加载失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  request(url, method = 'GET', data = {}) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token')
      wx.request({
        url: apiBase + url,
        method,
        data,
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
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

  // 升级会员
  upgrade() {
    wx.showToast({ title: '请联系客服升级', icon: 'none' })
  },

  // 查看缴费记录
  viewPayments() {
    if (this.data.payments.length > 0) {
      wx.showModal({
        title: '缴费记录',
        content: this.data.payments.map(p =>
          `${p.time} | ${p.level} | ¥${p.amount} | ${p.status}`
        ).join('\n'),
        showCancel: false
      })
    }
  }
})
