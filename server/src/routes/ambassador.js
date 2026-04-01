/**
 * 招商大使端API路由
 */

const express = require('express')
const router = express.Router()
const AmbassadorController = require('../controllers/ambassadorController')
const { authAmbassador } = require('../middleware/auth')

// 登录
router.post('/login', AmbassadorController.login)

// 需要认证的路由
router.use(authAmbassador)

// 首页数据
router.get('/home', AmbassadorController.getHomeData)

// 渠道码
router.get('/qrcode', AmbassadorController.getQrCode)

// 发展记录
router.get('/records', AmbassadorController.getRecords)

// 提成明细
router.get('/commission', AmbassadorController.getCommission)
router.get('/commission/summary', AmbassadorController.getCommissionSummary)

// 提现管理
router.get('/withdraw', AmbassadorController.getWithdrawAccount)
router.post('/withdraw/account', AmbassadorController.setWithdrawAccount)
router.post('/withdraw/apply', AmbassadorController.applyWithdraw)
router.get('/withdraw/history', AmbassadorController.getWithdrawHistory)

module.exports = router
