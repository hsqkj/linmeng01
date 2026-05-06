/**
 * 公共 API（无需登录）
 */
import request from '@/utils/request'

// 发送短信验证码
export const sendSms = (data) => request.post('/public/sms/send', data)

// 检查手机号是否已注册
export const checkPhone = (data) => request.post('/public/check/phone', data)

// 获取地区列表
export const getRegions = (params) => request.get('/public/regions', { params })

// 获取标签列表
export const getTags = (params) => request.get('/public/tags', { params })

// 获取行业分类
export const getIndustries = () => request.get('/public/industries')

// 招商大使申请
export const applyAmbassador = (data) => request.post('/public/ambassador/apply', data)

// 图片上传（使用FormData + busboy原生实现）
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return request.post('/public/upload-native', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ========== 智能客服公开接口 ==========

// 获取客服基本设置
export const getServiceConfig = () => request.get('/public/service/config')

// 获取FAQ列表
export const getFaqList = () => request.get('/public/service/faqs')

// 获取快捷问题列表
export const getQuickQuestions = () => request.get('/public/service/quick-questions')

// 微信绑定登录（社区端）
export const wechatBindLogin = (data) => request.post('/community/wechat/bind-login', data)
