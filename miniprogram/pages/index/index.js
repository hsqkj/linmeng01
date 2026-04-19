// 首页
const app = getApp()

Page({
  data: {
    currentRole: 'community',
    hasLogo: false
  },

  onLoad() {
    console.log('首页加载')
    // 获取当前角色
    const role = app.globalData.currentRole || 'community'
    this.setData({ currentRole: role })
  },

  onShow() {
    console.log('首页显示')
    // 更新当前角色
    const role = app.globalData.currentRole || 'community'
    this.setData({ currentRole: role })
  },

  // 进入角色
  enterRole(e) {
    const role = e.currentTarget.dataset.role
    console.log('点击角色:', role)
    
    // 保存当前角色
    app.globalData.currentRole = role
    
    // 未登录，跳转到登录页
    this.navigateToLogin(role)
  },

  // 跳转到登录页
  navigateToLogin(role) {
    console.log('跳转到登录页:', role)
    const pages = {
      community: '/pages/community/login/login',
      merchant: '/pages/merchant/login/login',
      ambassador: '/pages/ambassador/login/login'
    }
    const url = pages[role]
    console.log('完整路径:', url)
    wx.navigateTo({ url })
  },

  // 跳转到首页
  navigateToHome(role) {
    const pages = {
      community: '/pages/community/home/home',
      merchant: '/pages/merchant/home/home',
      ambassador: '/pages/ambassador/home/home'
    }
    wx.switchTab({ url: pages[role] })
  }
})
