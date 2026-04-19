// 自定义TabBar组件
Component({
  properties: {
    role: {
      type: String,
      value: 'community'
    }
  },
  
  data: {
    show: false,
    active: 'index'
  },
  
  lifetimes: {
    attached() {
      this.updateActive()
      this.setData({ show: true })
    }
  },
  
  pageLifetimes: {
    show() {
      this.updateActive()
    }
  },
  
  methods: {
    updateActive() {
      const app = getApp()
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = current ? current.route : ''
      
      let active = 'index'
      if (route.includes('resources')) {
        active = 'resources'
      } else if (route.includes('profile') || route.includes('orders') || route.includes('commission')) {
        active = 'profile'
      }
      
      this.setData({ active })
    },
    
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab
      const app = getApp()
      const role = app.globalData.currentRole || 'community'
      
      let url = '/pages/index/index'
      
      if (tab === 'index') {
        url = '/pages/index/index'
      } else if (tab === 'resources') {
        if (role === 'merchant') {
          url = '/pages/merchant/resources/resources'
        } else if (role === 'ambassador') {
          url = '/pages/ambassador/merchants/merchants'
        } else {
          url = '/pages/community/resources/resources'
        }
      } else if (tab === 'profile') {
        if (role === 'merchant') {
          url = '/pages/merchant/orders/orders'
        } else if (role === 'ambassador') {
          url = '/pages/ambassador/commission/commission'
        } else {
          url = '/pages/community/profile/profile'
        }
      }
      
      wx.switchTab({ url })
    }
  }
})
