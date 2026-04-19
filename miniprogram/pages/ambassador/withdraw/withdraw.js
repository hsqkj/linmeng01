/**
 * 大使端 - 提现
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

Page({
  data: {
    balance: 0,
    amount: '',
    account: {},
    history: [],
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    const token = wx.getStorageSync('token')
    const header = { Authorization: `Bearer ${token}` }

    try {
      const [accountRes, historyRes, summaryRes] = await Promise.all([
        this.request('/ambassador/withdraw', {}, header),
        this.request('/ambassador/withdraw/history', {}, header),
        this.request('/ambassador/commission/summary', {}, header)
      ])

      if (accountRes.data) this.setData({ account: accountRes.data })
      if (historyRes.data) this.setData({ history: historyRes.data.list || [] })
      if (summaryRes.data) {
        this.setData({ balance: summaryRes.data.total_commission - summaryRes.data.withdraw_amount })
      }
    } catch (err) {
      console.error('加载失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  submitWithdraw() {
    const { amount, balance } = this.data
    const num = parseFloat(amount)
    
    if (!num || num <= 0) {
      wx.showToast({ title: '请输入正确金额', icon: 'none' })
      return
    }
    
    if (num < 100) {
      wx.showToast({ title: '最低提现金额100元', icon: 'none' })
      return
    }
    
    if (num > balance) {
      wx.showToast({ title: '超过可提现余额', icon: 'none' })
      return
    }

    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/ambassador/withdraw/apply`,
      method: 'POST',
      data: { amount: num },
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      success: res => {
        if (res.data.code === 200 || res.data.code === 0) {
          wx.showToast({ title: '申请成功', icon: 'success' })
          this.loadData()
        } else {
          wx.showToast({ title: res.data.msg || '申请失败', icon: 'none' })
        }
      }
    })
  },

  request(url, data = {}, header = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method: 'GET',
        data,
        header: { 'Content-Type': 'application/json', ...header },
        success: resolve,
        fail: reject
      })
    })
  }
})
