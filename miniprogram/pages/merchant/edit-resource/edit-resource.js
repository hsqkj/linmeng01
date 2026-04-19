/**
 * 商家端编辑资源页
 */
const app = getApp()

Page({
  data: {
    loading: true,
    submitting: false,
    resourceId: null,
    resourceTypeName: '专业服务',
    form: {
      title: '',
      content: '',
      tags: [],
      expectedRewards: [],
      expectedRewardDesc: '',
      valid_until: '',
      // 资金赞助
      min_amount: 0,
      max_amount: 0,
      // 物资捐赠
      goodsDetail: '',
      pickup_way: 'both',
      // 志愿服务
      staff_count: 0,
      work_duration: 0,
      // 专业服务
      service_scope: 'city',
      certification: ''
    },
    tagOptions: ['连锁品牌', '本地企业', '上市公司', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任'],
    rewardOptions: ['活动冠名权', '现场展台', '社区公众号宣传', '业主群推送', '荣誉证书', '现场横幅', '宣传栏展示', '主持人口播', '媒体报道', '感谢状'],
    pickupWays: ['可配送', '自取', '均可'],
    pickupWayIndex: 2,
    serviceScopes: ['全市', '本区', '本街道', '线上'],
    serviceScopeIndex: 0
  },

  onLoad(options) {
    this.resourceId = options.id
    if (this.resourceId) {
      this.loadResource()
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
    }
  },

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

      // 资源类型名称
      const resourceTypes = ['专业服务', '教育培训', '场地资源', '物资捐赠', '志愿服务', '资金赞助', '技术支持', '健康医疗', '活动赞助', '媒体宣传', '技能培训', '养老服务']
      const typeIndex = parseInt(data.resource_type)
      const resourceTypeName = !isNaN(typeIndex) && typeIndex >= 0 && typeIndex < resourceTypes.length
        ? resourceTypes[typeIndex]
        : '专业服务'

      // 解析标签
      let tags = []
      if (data.tags) {
        if (Array.isArray(data.tags)) tags = data.tags
        else if (typeof data.tags === 'string') {
          try { tags = JSON.parse(data.tags) } catch { tags = [] }
        }
      }

      // 解析期望回报
      let expectedRewards = []
      if (data.expected_rewards) {
        if (Array.isArray(data.expected_rewards)) expectedRewards = data.expected_rewards
        else if (typeof data.expected_rewards === 'string') {
          try { expectedRewards = JSON.parse(data.expected_rewards) } catch { expectedRewards = [] }
        }
      }

      // 领取方式
      const pickupWayMap = { delivery: 0, pickup: 1, both: 2 }
      const pickupWays = ['可配送', '自取', '均可']
      const pickupWayIndex = pickupWayMap[data.pickup_way] ?? 2

      // 服务范围
      const serviceScopeMap = { city: 0, district: 1, street: 2, online: 3 }
      const serviceScopeIndex = serviceScopeMap[data.service_scope] ?? 0

      this.setData({
        loading: false,
        resourceTypeName,
        form: {
          title: data.title || '',
          content: data.content || '',
          tags: tags,
          expectedRewards: expectedRewards,
          expectedRewardDesc: data.expected_reward_desc || '',
          valid_until: data.valid_until || '',
          min_amount: data.min_amount || 0,
          max_amount: data.max_amount || 0,
          goodsDetail: data.specs || '',
          pickup_way: data.pickup_way || 'both',
          staff_count: data.staff_count || 0,
          work_duration: data.work_duration || 0,
          service_scope: data.service_scope || 'city',
          certification: data.certification || ''
        },
        pickupWayIndex,
        serviceScopeIndex
      })
    } catch (err) {
      console.error('加载资源失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  // 输入处理
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value })
  },
  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value })
  },
  onMinAmountInput(e) {
    this.setData({ 'form.min_amount': parseInt(e.detail.value) || 0 })
  },
  onMaxAmountInput(e) {
    this.setData({ 'form.max_amount': parseInt(e.detail.value) || 0 })
  },
  onGoodsDetailInput(e) {
    this.setData({ 'form.goodsDetail': e.detail.value })
  },
  onStaffCountInput(e) {
    this.setData({ 'form.staff_count': parseInt(e.detail.value) || 0 })
  },
  onWorkDurationInput(e) {
    this.setData({ 'form.work_duration': parseFloat(e.detail.value) || 0 })
  },
  onCertificationInput(e) {
    this.setData({ 'form.certification': e.detail.value })
  },
  onExpectedRewardDescInput(e) {
    this.setData({ 'form.expectedRewardDesc': e.detail.value })
  },

  // 选择器
  onPickupWayChange(e) {
    const pickupWays = ['delivery', 'pickup', 'both']
    this.setData({
      pickupWayIndex: parseInt(e.detail.value),
      'form.pickup_way': pickupWays[parseInt(e.detail.value)]
    })
  },
  onServiceScopeChange(e) {
    const scopes = ['city', 'district', 'street', 'online']
    this.setData({
      serviceScopeIndex: parseInt(e.detail.value),
      'form.service_scope': scopes[parseInt(e.detail.value)]
    })
  },
  onValidUntilChange(e) {
    this.setData({ 'form.valid_until': e.detail.value })
  },

  // 标签操作
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const tags = [...this.data.form.tags]
    const index = tags.indexOf(tag)
    if (index >= 0) {
      tags.splice(index, 1)
    } else {
      if (tags.length >= 10) {
        wx.showToast({ title: '最多10个标签', icon: 'none' })
        return
      }
      tags.push(tag)
    }
    this.setData({ 'form.tags': tags })
  },

  // 期望回报操作
  toggleReward(e) {
    const reward = e.currentTarget.dataset.reward
    const rewards = [...this.data.form.expectedRewards]
    const index = rewards.indexOf(reward)
    if (index >= 0) {
      rewards.splice(index, 1)
    } else {
      rewards.push(reward)
    }
    this.setData({ 'form.expectedRewards': rewards })
  },

  // 保存
  async saveResource() {
    if (!this.data.form.title) {
      wx.showToast({ title: '请填写资源标题', icon: 'none' })
      return
    }
    await this.submitResource()
  },

  // 提交
  async submitResource() {
    if (!this.data.form.title) {
      wx.showToast({ title: '请填写资源标题', icon: 'none' })
      return
    }
    if (!this.data.form.content) {
      wx.showToast({ title: '请填写详细介绍', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const form = this.data.form
    const data = {
      title: form.title,
      content: form.content,
      tags: form.tags,
      expected_rewards: form.expectedRewards,
      expected_reward_desc: form.expectedRewardDesc,
      valid_until: form.valid_until || null,
      // 资金赞助
      min_amount: form.min_amount,
      max_amount: form.max_amount,
      // 物资捐赠
      specs: form.goodsDetail,
      pickup_way: form.pickup_way,
      // 志愿服务
      staff_count: form.staff_count,
      work_duration: form.work_duration,
      // 专业服务
      service_scope: form.service_scope,
      certification: form.certification
    }

    try {
      await this.request(`/merchant/resources/${this.resourceId}`, data, 'PUT')
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      wx.showToast({ title: err.msg || '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
