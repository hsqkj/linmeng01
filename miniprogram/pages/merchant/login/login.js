/**
 * 商家端登录页面
 */
const app = getApp()

Page({
  data: {
    agreed: false,
    showPhoneModal: false,
    phone: '',
    code: '',
    countdown: 0
  },

  onLoad(options) {
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    if (token && userType === 'merchant') {
      this.goBack()
    }
  },

  // 勾选用户协议
  onAgreementChange(e) {
    this.setData({ agreed: e.detail.value.includes('agree') })
  },

  // 显示用户协议
  showTerms() {
    wx.navigateTo({
      url: '/pages/webview/webview?type=terms'
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.navigateTo({
      url: '/pages/webview/webview?type=privacy'
    })
  },

  // 微信一键登录（获取手机号）
  onGetPhoneNumber(e) {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' })
      return
    }

    console.log('getPhoneNumber result:', e.detail)
    
    // 检查是否有 code（模拟器可能没有，需要真机）
    if (!e.detail.code) {
      // 模拟器环境下，使用测试账号登录
      this.mockLogin('merchant')
      return
    }

    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '您拒绝了授权', icon: 'none' })
      return
    }

    const app = getApp()
    
    wx.showLoading({ title: '登录中...' })
    
    // 先确保有 openid
    app.wechatLogin()
      .then(() => {
        // 调用后端接口绑定手机号
        return wx.request({
          url: `${app.globalData.apiBase}/wechat/bindPhone`,
          method: 'POST',
          data: {
            code: e.detail.code,
            openid: app.globalData.openid,
            type: 'merchant'
          }
        })
      })
      .then(res => {
        wx.hideLoading()
        console.log('登录响应:', res.data)
        // 后端返回 code: 200 表示成功
        if (res.data.code === 200 || res.data.code === 0) {
          // 登录成功
          wx.setStorageSync('token', res.data.data.token)
          wx.setStorageSync('phone', res.data.data.phone)
          wx.setStorageSync('userType', 'merchant')
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => this.goBack(), 1500)
        } else {
          wx.showToast({ title: res.data.msg || '登录失败', icon: 'none' })
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('登录失败', err)
        wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      })
  },

  // 显示手机号登录弹窗
  showPhoneLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' })
      return
    }
    this.setData({ showPhoneModal: true })
  },

  // 关闭手机号登录弹窗
  closePhoneModal() {
    this.setData({ showPhoneModal: false })
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 输入手机号
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 输入验证码
  onCodeInput(e) {
    this.setData({ code: e.detail.value })
  },

  // 发送验证码
  sendCode() {
    const phone = this.data.phone
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    const app = getApp()
    
    // 先确保有 openid
    app.wechatLogin()
      .then(() => {
        return wx.request({
          url: `${app.globalData.apiBase}/merchant/sendCode`,
          method: 'POST',
          data: {
            phone,
            openid: app.globalData.openid,
            type: 'merchant'
          }
        })
      })
      .then(res => {
        if (res.data.code === 200 || res.data.code === 0) {
          wx.showToast({ title: '验证码已发送', icon: 'success' })
          // 开始倒计时
          this.setData({ countdown: 60 })
          const timer = setInterval(() => {
            const countdown = this.data.countdown - 1
            if (countdown <= 0) {
              clearInterval(timer)
            }
            this.setData({ countdown })
          }, 1000)
        } else {
          wx.showToast({ title: res.data.msg || '发送失败', icon: 'none' })
        }
      })
      .catch(err => {
        wx.showToast({ title: '发送失败', icon: 'none' })
      })
  },

  // 手机号登录
  phoneLogin() {
    const { phone, code } = this.data
    
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    
    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    const app = getApp()
    const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'
    
    wx.showLoading({ title: '登录中...' })
    
    wx.request({
      url: `${apiBase}/merchant/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        phone,
        code,
        openid: app.globalData.openid || '',
        type: 'merchant'
      },
      success: res => {
        wx.hideLoading()
        console.log('登录响应:', res.data)
        // 后端返回 code: 200 表示成功
        if (res.data.code === 200 || res.data.code === 0) {
          wx.setStorageSync('token', res.data.data.token)
          wx.setStorageSync('phone', phone)
          wx.setStorageSync('userType', 'merchant')
          this.setData({ showPhoneModal: false })
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => this.goBack(), 1500)
        } else {
          wx.showToast({ title: res.data.msg || '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  },

  // 返回上一页或跳转首页
  goBack() {
    // 登录成功后跳转到商家首页
    wx.reLaunch({ url: '/pages/merchant/home/home' })
  },

  // 模拟登录（开发环境/模拟器使用）
  mockLogin(userType) {
    wx.showLoading({ title: '登录中...' })
    
    const testPhone = '18800000002'  // 商家测试账号
    const apiBase = getApp().globalData.apiBase || 'http://127.0.0.1:3000/api'
    
    console.log('开始登录，API地址:', apiBase)
    
    wx.request({
      url: `${apiBase}/merchant/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        phone: testPhone,
        code: '123456',
        type: userType
      },
      success: res => {
        wx.hideLoading()
        console.log('登录响应:', res.data)
        // 后端返回 code: 200 表示成功
        if (res.data.code === 200 || res.data.code === 0) {
          wx.setStorageSync('token', res.data.data.token)
          wx.setStorageSync('phone', testPhone)
          wx.setStorageSync('userType', userType)
          wx.showToast({ title: '登录成功（测试账号）', icon: 'success' })
          setTimeout(() => this.goBack(), 1500)
        } else {
          wx.showToast({ title: res.data.msg || '登录失败', icon: 'none' })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('登录请求失败', err)
        wx.showModal({
          title: '登录失败',
          content: '无法连接到服务器，请确保后端已启动',
          showCancel: false
        })
      }
    })
  }
})
