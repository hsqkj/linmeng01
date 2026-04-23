/**
 * 商家端发布资源
 */
const app = getApp()
const apiBase = app.globalData.apiBase || 'http://127.0.0.1:3000/api'

// 资源类型图标映射（保持UI一致性）
const RESOURCE_TYPE_ICONS = {
  0: '🌟', 1: '🎓', 2: '🏠', 3: '📦', 4: '👥', 5: '💵',
  6: '💻', 7: '🏥', 8: '🎪', 9: '📰', 10: '🎯', 11: '🧓'
}

Page({
  data: {
    activeStep: 0,
    resourceTypes: [], // 从 API 动态加载
    titlePlaceholder: '一句话概括您提供的资源',
    goodsTypeOptions: ['食品饮料', '生活用品', '防疫物资', '学习用品', '体育用品', '服装鞋帽', '图书文具', '电子产品'],
    facilityOptions: ['投影仪', 'WiFi', '空调', '舞台', '音响', '停车位'],
    rewardTypeOptions: ['品牌曝光', 'Logo展示', '公众号推广', '感谢牌匾', '合作证书', '优先合作权', '媒体报道'],
    formData: {
      resource_type: null,
      title: '',
      description: '',
      images: [],
      min_amount: '',
      max_amount: '',
      goodsTypes: [],
      goods_list: '',
      pickup_way: 'both',
      staff_count: '',
      work_duration: '',
      manpower_desc: '',
      space_area: '',
      capacity: '',
      facilities: [],
      open_hours: '',
      expected_rewards: [],
      expected_reward_desc: ''
    },
    editingId: null,
    agreed: false
  },

  onLoad(options) {
    this.loadPublishTypes()
    if (options.id) {
      this.setData({ editingId: options.id })
      this.loadResource(options.id)
    }
  },

  // 加载发布页类型配置
  loadPublishTypes() {
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/public/publish-types`,
      method: 'GET',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: res => {
        if (res.data.code === 0 || res.data.code === 200) {
          const resourceTypes = (res.data.data.resource_types || []).map(t => ({
            icon: RESOURCE_TYPE_ICONS[t.id] || '📋',
            label: t.name,
            value: t.id,
            desc: `提供${t.name}类资源`
          }))
          this.setData({ resourceTypes })
        }
      },
      fail: () => {
        // API 失败时使用默认配置
        console.error('加载资源类型失败')
      }
    })
  },

  loadResource(id) {
    const token = wx.getStorageSync('token')
    wx.request({
      url: `${apiBase}/merchant/resource/${id}`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: res => {
        if (res.data.code === 0 || res.data.code === 200) {
          const data = res.data.data
          this.setData({
            'formData.resource_type': data.resource_type,
            'formData.title': data.title,
            'formData.description': data.description,
            'formData.images': data.images || [],
            'formData.min_amount': data.min_amount || '',
            'formData.max_amount': data.max_amount || '',
            'formData.goodsTypes': data.goods_types ? JSON.parse(data.goods_types) : [],
            'formData.goods_list': data.goods_list || '',
            'formData.pickup_way': data.pickup_way || 'both',
            'formData.staff_count': data.staff_count || '',
            'formData.work_duration': data.work_duration || '',
            'formData.manpower_desc': data.manpower_desc || '',
            'formData.space_area': data.space_area || '',
            'formData.capacity': data.capacity || '',
            'formData.facilities': data.facilities ? (typeof data.facilities === 'string' ? JSON.parse(data.facilities) : data.facilities) : [],
            'formData.open_hours': data.open_hours || '',
            'formData.expected_rewards': data.expected_rewards ? (typeof data.expected_rewards === 'string' ? JSON.parse(data.expected_rewards) : data.expected_rewards) : [],
            'formData.expected_reward_desc': data.expected_reward_desc || ''
          })
        }
      }
    })
  },

  // 选择资源类型
  selectType(e) {
    const index = e.currentTarget.dataset.index
    const type = e.currentTarget.dataset.type
    this.setData({
      'formData.resource_type': type,
      'formData.resource_type_index': index
    })
  },

  // 更新标题
  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value })
  },

  // 金额相关
  onMinAmountInput(e) {
    this.setData({ 'formData.min_amount': e.detail.value })
  },
  onMaxAmountInput(e) {
    this.setData({ 'formData.max_amount': e.detail.value })
  },

  // 物资相关
  toggleGoodsType(e) {
    const type = e.currentTarget.dataset.type
    const goodsTypes = this.data.formData.goodsTypes
    const index = goodsTypes.indexOf(type)
    if (index > -1) {
      goodsTypes.splice(index, 1)
    } else {
      goodsTypes.push(type)
    }
    this.setData({ 'formData.goodsTypes': goodsTypes })
  },
  onGoodsListInput(e) {
    this.setData({ 'formData.goods_list': e.detail.value })
  },
  onPickupWayChange(e) {
    this.setData({ 'formData.pickup_way': e.detail.value })
  },

  // 人力相关
  onStaffCountInput(e) {
    this.setData({ 'formData.staff_count': e.detail.value })
  },
  onWorkDurationInput(e) {
    this.setData({ 'formData.work_duration': e.detail.value })
  },
  onManpowerDescInput(e) {
    this.setData({ 'formData.manpower_desc': e.detail.value })
  },

  // 场地相关
  onSpaceAreaInput(e) {
    this.setData({ 'formData.space_area': e.detail.value })
  },
  onCapacityInput(e) {
    this.setData({ 'formData.capacity': e.detail.value })
  },
  toggleFacility(e) {
    const type = e.currentTarget.dataset.type
    const facilities = this.data.formData.facilities
    const index = facilities.indexOf(type)
    if (index > -1) {
      facilities.splice(index, 1)
    } else {
      facilities.push(type)
    }
    this.setData({ 'formData.facilities': facilities })
  },
  onOpenHoursInput(e) {
    this.setData({ 'formData.open_hours': e.detail.value })
  },

  // 描述
  onDescInput(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  // 回报相关
  toggleRewardType(e) {
    const type = e.currentTarget.dataset.type
    const rewards = this.data.formData.expected_rewards
    const index = rewards.indexOf(type)
    if (index > -1) {
      rewards.splice(index, 1)
    } else {
      rewards.push(type)
    }
    this.setData({ 'formData.expected_rewards': rewards })
  },
  onRewardDescInput(e) {
    this.setData({ 'formData.expected_reward_desc': e.detail.value })
  },

  // 协议
  onAgreementChange(e) {
    this.setData({ agreed: e.detail.value.includes('agreed') })
  },
  showTerms() {
    wx.showModal({ title: '用户协议', content: '用户协议内容...', showCancel: false })
  },
  showPrivacy() {
    wx.showModal({ title: '隐私政策', content: '隐私政策内容...', showCancel: false })
  },

  // 图片上传
  chooseImage() {
    const count = 9 - this.data.formData.images.length
    wx.chooseImage({
      count: count,
      success: res => {
        this.setData({
          'formData.images': [...this.data.formData.images, ...res.tempFilePaths]
        })
      }
    })
  },
  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.images
    images.splice(index, 1)
    this.setData({ 'formData.images': images })
  },

  // 步骤切换
  prevStep() {
    if (this.data.activeStep > 0) {
      this.setData({ activeStep: this.data.activeStep - 1 })
    }
  },
  nextStep() {
    // 步骤1：必须选择类型
    if (this.data.activeStep === 0 && this.data.formData.resource_type === null) {
      wx.showToast({ title: '请选择资源类型', icon: 'none' })
      return
    }
    // 步骤2：必须填写标题和描述
    if (this.data.activeStep === 1) {
      if (!this.data.formData.title.trim()) {
        wx.showToast({ title: '请填写资源标题', icon: 'none' })
        return
      }
      if (!this.data.formData.description.trim()) {
        wx.showToast({ title: '请填写详细描述', icon: 'none' })
        return
      }
      // 资金赞助必须填写最高金额
      if (this.data.formData.resource_type === 5 && !this.data.formData.max_amount) {
        wx.showToast({ title: '请填写可赞助最高金额', icon: 'none' })
        return
      }
    }

    if (this.data.activeStep < 3) {
      this.setData({ activeStep: this.data.activeStep + 1 })
    }
  },

  // 提交
  submit() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
      return
    }

    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    const formData = this.data.formData
    // 提交时需要的字段
    const submitData = {
      resource_type: formData.resource_type,
      title: formData.title,
      description: formData.description,
      images: formData.images,
      // 资金赞助
      min_amount: formData.min_amount,
      max_amount: formData.max_amount,
      // 物资
      goods_types: JSON.stringify(formData.goodsTypes),
      goods_list: formData.goods_list,
      pickup_way: formData.pickup_way,
      // 人力
      staff_count: formData.staff_count,
      work_duration: formData.work_duration,
      manpower_desc: formData.manpower_desc,
      // 场地
      space_area: formData.space_area,
      capacity: formData.capacity,
      facilities: JSON.stringify(formData.facilities),
      open_hours: formData.open_hours,
      // 回报
      expected_rewards: JSON.stringify(formData.expected_rewards),
      expected_reward_desc: formData.expected_reward_desc
    }

    const method = this.data.editingId ? 'PUT' : 'POST'
    const url = this.data.editingId
      ? `${apiBase}/merchant/resource/${this.data.editingId}`
      : `${apiBase}/merchant/resource`

    wx.request({
      url,
      method,
      data: submitData,
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: res => {
        wx.hideLoading()
        if (res.data.code === 0 || res.data.code === 200) {
          wx.showToast({ title: '发布成功', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({ title: res.data.msg || '发布失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})
