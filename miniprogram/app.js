/**
 * 邻盟小程序入口文件
 */

// 加载API配置
const apiConfig = require('./config/api.config.js')

App({
  // 全局数据
  globalData: {
    userInfo: null,
    openid: '',
    unionid: '',
    token: '',
    isLoggedIn: false,
    // 小程序配置
    appid: 'wx0d8ceb64dd56ca6c',
    publicAppid: 'wxa382e1c9fb93780e',
    // API地址
    apiBase: apiConfig.apiBase,
    wsBase: apiConfig.wsBase
  },

  // 应用初始化
  onLaunch(options) {
    console.log('小程序启动', options)
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const openid = wx.getStorageSync('openid')
    const userType = wx.getStorageSync('userType')
    if (token && openid) {
      this.globalData.token = token
      this.globalData.openid = openid
      this.globalData.userType = userType
      this.globalData.isLoggedIn = true
    }
  },

  // 微信登录
  wechatLogin() {
    return new Promise((resolve, reject) => {
      // 第一步：调用 wx.login 获取 code
      wx.login({
        success: loginRes => {
          console.log('wx.login 成功', loginRes.code)
          
          // 第二步：将 code 发送到后端换取 openid
          const apiBase = require('./config/api.config.js').apiBase
          wx.request({
            url: `${apiBase}/wechat/code2session`,
            method: 'POST',
            data: { code: loginRes.code },
            success: res => {
              console.log('后端返回', res.data)
              if (res.data.code === 0 && res.data.data) {
                const { openid, unionid, session_key } = res.data.data
                this.globalData.openid = openid
                this.globalData.unionid = unionid || ''
                
                // 存储到本地
                wx.setStorageSync('openid', openid)
                wx.setStorageSync('unionid', unionid || '')
                
                resolve({ openid, unionid })
              } else {
                reject(new Error(res.data.msg || '登录失败'))
              }
            },
            fail: err => {
              console.error('请求失败', err)
              reject(err)
            }
          })
        },
        fail: err => {
          console.error('wx.login 失败', err)
          reject(err)
        }
      })
    })
  },

  // 获取用户手机号（需要用户点击按钮授权）
  getPhoneNumber(e) {
    return new Promise((resolve, reject) => {
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        reject(new Error('用户拒绝授权手机号'))
        return
      }
      
      const { code } = e.detail
      
      const apiBase = require('./config/api.config.js').apiBase
      wx.request({
        url: `${apiBase}/wechat/decodePhone`,
        method: 'POST',
        data: {
          code: code,
          openid: this.globalData.openid
        },
        success: res => {
          if (res.data.code === 0 && res.data.data) {
            const { phone, token, userType } = res.data.data
            this.globalData.token = token
            this.globalData.isLoggedIn = true
            wx.setStorageSync('token', token)
            wx.setStorageSync('phone', phone)
            wx.setStorageSync('userType', userType || 'community')
            resolve({ phone, token, userType })
          } else {
            reject(new Error(res.data.msg || '绑定手机号失败'))
          }
        },
        fail: reject
      })
    })
  },

  // 获取用户信息（头像、昵称）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: res => {
          const userInfo = res.userInfo
          this.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
          resolve(userInfo)
        },
        fail: err => {
          reject(err)
        }
      })
    })
  }
})
