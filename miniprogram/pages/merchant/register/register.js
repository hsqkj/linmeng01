/**
 * 商家端注册页
 */
const app = getApp()

Page({
  data: {
    currentStep: 1,
    loading: false,
    submitting: false,
    countdown: 0,
    form: {
      company_name: '',
      industry: '',
      contact_name: '',
      phone: '',
      code: '',
      password: '',
      confirmPassword: '',
      scale: '',
      district: '',
      street: '',
      community: '',
      address: '',
      description: '',
      agree: false
    },
    industries: ['教育培训', '餐饮服务', '健康医疗', '金融服务', '零售百货', '文化娱乐', '科技服务', '生活服务', '其他'],
    industryIndex: 0,
    scales: ['1-10人', '11-50人', '51-100人', '101-500人', '500人以上'],
    scaleIndex: 0,
    region: []
  },

  onLoad() {
    // 从 URL 参数获取推荐人
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage.options && currentPage.options.code) {
      this.setData({ 'form.referrer': currentPage.options.code })
    }
  },

  request(url, data = {}, method = 'GET') {
    const apiBase = app.globalData.apiBase || 'http://150.158.12.243/api'
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${apiBase}${url}`,
        method,
        data,
        header: { 'Content-Type': 'application/json' },
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

  goBack() {
    wx.navigateBack()
  },

  // 输入处理
  onCompanyNameInput(e) {
    this.setData({ 'form.company_name': e.detail.value })
  },
  onContactNameInput(e) {
    this.setData({ 'form.contact_name': e.detail.value })
  },
  onPhoneInput(e) {
    this.setData({ 'form.phone': e.detail.value })
  },
  onCodeInput(e) {
    this.setData({ 'form.code': e.detail.value })
  },
  onPasswordInput(e) {
    this.setData({ 'form.password': e.detail.value })
  },
  onConfirmPasswordInput(e) {
    this.setData({ 'form.confirmPassword': e.detail.value })
  },
  onAddressInput(e) {
    this.setData({ 'form.address': e.detail.value })
  },
  onDescriptionInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // 选择器
  onIndustryChange(e) {
    this.setData({
      industryIndex: parseInt(e.detail.value),
      'form.industry': this.data.industries[parseInt(e.detail.value)]
    })
  },
  onScaleChange(e) {
    this.setData({
      scaleIndex: parseInt(e.detail.value),
      'form.scale': this.data.scales[parseInt(e.detail.value)]
    })
  },
  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      region,
      'form.district': region[0] || '',
      'form.street': region[1] || '',
      'form.community': region[2] || ''
    })
  },

  onAgreementChange(e) {
    const checked = e.detail.value.includes('agree')
    this.setData({ 'form.agree': checked })
  },

  // 发送验证码
  async sendCode() {
    if (!this.data.form.phone) {
      wx.showToast({ title: '请先输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.form.phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (this.data.countdown > 0) return

    try {
      const res = await this.request('/public/sms/send', {
        phone: this.data.form.phone,
        type: 'register'
      }, 'POST')
      // 测试环境自动填充验证码
      if (res.data && res.data.code) {
        this.setData({ 'form.code': String(res.data.code) })
        wx.showToast({ title: '验证码已发送（测试：' + res.data.code + '）', icon: 'none', duration: 3000 })
      } else {
        wx.showToast({ title: '验证码已发送', icon: 'success' })
      }
      this.startCountdown()
    } catch (err) {
      wx.showToast({ title: err.msg || '发送失败', icon: 'none' })
    }
  },

  startCountdown() {
    this.setData({ countdown: 60 })
    const timer = setInterval(() => {
      const c = this.data.countdown - 1
      this.setData({ countdown: c })
      if (c <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  },

  // 步骤验证
  validateStep1() {
    const form = this.data.form
    if (!form.company_name) {
      wx.showToast({ title: '请输入商家名称', icon: 'none' })
      return false
    }
    if (!form.contact_name) {
      wx.showToast({ title: '请输入联系人姓名', icon: 'none' })
      return false
    }
    if (!form.phone || !/^1[3-9]\d{9}$/.test(form.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return false
    }
    if (!form.code) {
      wx.showToast({ title: '请输入验证码', icon: 'none' })
      return false
    }
    if (!form.password || form.password.length < 6) {
      wx.showToast({ title: '密码长度6-20位', icon: 'none' })
      return false
    }
    if (form.password !== form.confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return false
    }
    return true
  },

  goStep2() {
    if (this.validateStep1()) {
      this.setData({ currentStep: 2 })
    }
  },

  goStep1() {
    this.setData({ currentStep: 1 })
  },

  skipStep2() {
    if (!this.data.form.agree) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    this.doRegister()
  },

  async submitRegister() {
    if (!this.data.form.agree) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    await this.doRegister()
  },

  async doRegister() {
    const form = this.data.form
    
    // 验证行政区划
    if (!form.district || !form.street || !form.community) {
      wx.showToast({ title: '请选择完整的行政区划', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      await this.request('/merchant/register', {
        username: form.contact_name,
        password: form.password,
        company_name: form.company_name,
        industry: form.industry,
        contact_name: form.contact_name,
        phone: form.phone,
        scale: form.scale || '',
        district: form.district,
        street: form.street,
        community: form.community,
        address: form.address || '',
        description: form.description || '',
        referrer: form.referrer || ''
      }, 'POST')

      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/merchant/login/login' })
      }, 1500)
    } catch (err) {
      wx.showToast({ title: err.msg || '注册失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/merchant/login/login' })
  }
})
