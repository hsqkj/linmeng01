/**
 * 资源详情页
 */
const app = getApp()

Page({
  data: {
    resource: {},
    images: [],
    markers: [],
    isFavorited: false
  },

  onLoad(options) {
    this.loadResourceDetail(options.id)
  },

  // 加载资源详情
  loadResourceDetail(id) {
    const that = this
    
    app.request({
      url: '/community/resourceDetail',
      data: { id }
    }).then(data => {
      // 处理图片
      let images = []
      if (data.images) {
        if (typeof data.images === 'string') {
          try {
            images = JSON.parse(data.images)
          } catch {
            images = [data.images]
          }
        } else if (Array.isArray(data.images)) {
          images = data.images
        }
      }
      
      // 处理地图标记
      const markers = []
      if (data.merchant_lat && data.merchant_lng) {
        markers.push({
          id: 1,
          latitude: data.merchant_lat,
          longitude: data.merchant_lng,
          width: 30,
          height: 30,
          iconPath: '/assets/icons/marker.png'
        })
      }
      
      // 检查是否已收藏
      const favoriteIds = wx.getStorageSync('favoriteIds') || []
      const isFavorited = favoriteIds.includes(parseInt(id))
      
      that.setData({
        resource: data,
        images,
        markers,
        isFavorited
      })
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  // 切换收藏
  toggleFavorite() {
    const that = this
    const token = wx.getStorageSync('token')
    
    if (!token) {
      wx.navigateTo({ url: '/pages/community/login/login' })
      return
    }

    app.request({
      url: '/community/toggleFavorite',
      method: 'POST',
      data: { resourceId: that.data.resource.id }
    }).then(() => {
      const isFavorited = !that.data.isFavorited
      const favoriteCount = (that.data.resource.favorite_count || 0) + (isFavorited ? 1 : -1)
      
      // 更新本地存储
      let favoriteIds = wx.getStorageSync('favoriteIds') || []
      if (isFavorited) {
        favoriteIds.push(that.data.resource.id)
      } else {
        favoriteIds = favoriteIds.filter(id => id !== that.data.resource.id)
      }
      wx.setStorageSync('favoriteIds', favoriteIds)
      
      that.setData({
        isFavorited,
        'resource.favorite_count': favoriteCount
      })
      
      wx.showToast({
        title: isFavorited ? '收藏成功' : '取消收藏',
        icon: 'success'
      })
    }).catch(() => {})
  },

  // 联系商家
  contactMerchant() {
    // 显示商家联系方式或跳转聊天
    wx.showModal({
      title: '联系方式',
      content: this.data.resource.merchant_phone || '暂无联系方式',
      showCancel: true,
      confirmText: '拨打',
      cancelText: '取消',
      success: res => {
        if (res.confirm && this.data.resource.merchant_phone) {
          wx.makePhoneCall({
            phoneNumber: this.data.resource.merchant_phone
          })
        }
      }
    })
  },

  // 申请撮合
  applyMatch() {
    const token = wx.getStorageSync('token')
    
    if (!token) {
      wx.navigateTo({ url: '/pages/community/login/login' })
      return
    }

    wx.showModal({
      title: '申请撮合',
      content: '确定要申请撮合此资源吗？',
      success: res => {
        if (res.confirm) {
          app.request({
            url: '/community/applyMatch',
            method: 'POST',
            data: { resourceId: this.data.resource.id }
          }).then(() => {
            wx.showToast({ title: '申请已提交', icon: 'success' })
          }).catch(() => {
            wx.showToast({ title: '申请失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 跳转商家主页
  goMerchantHome() {
    if (this.data.resource.merchant_id) {
      wx.navigateTo({
        url: `/pages/merchant/home/home?id=${this.data.resource.merchant_id}`
      })
    }
  },

  // 打开地图
  openMap() {
    const { merchant_lat, merchant_lng, merchant_address } = this.data.resource
    if (merchant_lat && merchant_lng) {
      wx.openLocation({
        latitude: parseFloat(merchant_lat),
        longitude: parseFloat(merchant_lng),
        name: '商家位置',
        address: merchant_address || ''
      })
    }
  },

  onShareAppMessage() {
    const { resource } = this.data
    return {
      title: resource.title,
      path: `/pages/community/resource-detail/resource-detail?id=${resource.id}`,
      imageUrl: resource.images && resource.images[0]
    }
  },

  onShareTimeline() {
    const { resource } = this.data
    return {
      title: resource.title,
      query: `id=${resource.id}`,
      imageUrl: resource.images && resource.images[0]
    }
  }
})
