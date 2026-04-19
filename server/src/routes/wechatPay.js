/**
 * 微信支付相关接口
 * 需要先在微信商户平台下载商户证书：
 * - apiclient_cert.pem
 * - apiclient_key.pem
 * 
 * 商户API密钥在微信商户平台 → API安全 → 设置API密钥
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/db');

// 加载环境变量
const envPath = path.join(__dirname, '../../.env.local');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      envConfig[key.trim()] = values.join('=').trim();
    }
  });
}

const WECHAT_PAY_MCHID = envConfig.WECHAT_PAY_MCHID || '779535356';
const WECHAT_PAY_APIKEY = envConfig.WECHAT_PAY_APIKEY || '';
const WECHAT_PAY_NOTIFY_URL = envConfig.WECHAT_PAY_NOTIFY_URL || 'https://www.3qall.com/api/wechat/pay/notify';

// 微信支付工具函数
const wxPayUtil = {
  // 生成随机字符串
  generateNonceStr() {
    return crypto.randomBytes(16).toString('hex');
  },

  // 生成签名
  generateSign(params, key) {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${key}`;
    return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
  },

  // 生成订单号
  generateOrderId() {
    return `LM${Date.now()}${this.generateNonceStr().substring(0, 6).toUpperCase()}`;
  },

  // XML转对象
  xmlToObj(xml) {
    const obj = {};
    const pattern = /<(\w+)>([^<]+)<\/\1>/g;
    let match;
    while ((match = pattern.exec(xml)) !== null) {
      obj[match[1]] = match[2];
    }
    return obj;
  },

  // 对象转XML
  objToXml(obj) {
    let xml = '<xml>';
    for (const [key, value] of Object.entries(obj)) {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    }
    xml += '</xml>';
    return xml;
  }
};

/**
 * 统一下单接口
 * POST /api/wechat/pay/unifiedorder
 */
router.post('/unifiedorder', async (req, res) => {
  try {
    const {
      openid,
      body,
      total_fee,
      order_id,
      attach,
      trade_type = 'JSAPI'
    } = req.body;

    if (!openid || !body || !total_fee) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const nonce_str = wxPayUtil.generateNonceStr();
    const out_trade_no = order_id || wxPayUtil.generateOrderId();
    const spbill_create_ip = req.ip === '::1' ? '127.0.0.1' : req.ip;

    // 统一下单参数
    const params = {
      appid: envConfig.WECHAT_MINI_APPID,
      mch_id: WECHAT_PAY_MCHID,
      nonce_str,
      body: body.substring(0, 128),
      out_trade_no,
      total_fee: Math.round(total_fee * 100), // 转换为分
      spbill_create_ip,
      notify_url: WECHAT_PAY_NOTIFY_URL,
      trade_type,
      openid
    };

    // 生成签名
    params.sign = wxPayUtil.generateSign(params, WECHAT_PAY_APIKEY);

    // 发送请求
    const xmlData = wxPayUtil.objToXml(params);
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
      headers: { 'Content-Type': 'text/xml' }
    });

    const result = wxPayUtil.xmlToObj(response.data);

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      // 生成小程序支付的sign参数
      const timeStamp = Math.floor(Date.now() / 1000).toString();
      const prepay_id = result.prepay_id;

      // 小程序调起支付的签名
      const paySignParams = {
        appId: envConfig.WECHAT_MINI_APPID,
        timeStamp,
        nonceStr: nonce_str,
        package: `prepay_id=${prepay_id}`,
        signType: 'MD5'
      };
      const paySign = wxPayUtil.generateSign(paySignParams, WECHAT_PAY_APIKEY);

      res.json({
        success: true,
        data: {
          timeStamp,
          nonceStr: nonce_str,
          package: `prepay_id=${prepay_id}`,
          signType: 'MD5',
          paySign,
          out_trade_no
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.return_msg || result.err_code_des || '统一下单失败'
      });
    }
  } catch (error) {
    console.error('微信支付统一下单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 支付回调通知
 * POST /api/wechat/pay/notify
 */
router.post('/notify', async (req, res) => {
  try {
    let xmlData = '';
    req.setEncoding('utf8');
    req.on('data', chunk => xmlData += chunk);
    
    await new Promise((resolve, reject) => {
      req.on('end', resolve);
      req.on('error', reject);
    });

    const result = wxPayUtil.xmlToObj(xmlData);
    
    // 验证签名
    const sign = result.sign;
    delete result.sign;
    const calculatedSign = wxPayUtil.generateSign(result, WECHAT_PAY_APIKEY);

    if (calculatedSign !== sign) {
      console.error('微信支付回调签名验证失败');
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名失败]]></return_msg></xml>');
    }

    if (result.return_code === 'SUCCESS') {
      const { out_trade_no, transaction_id, total_fee } = result;
      
      // 更新订单状态
      // 根据out_trade_no查询对应业务订单并更新状态
      // TODO: 根据实际业务逻辑处理
      console.log(`支付成功: 订单号=${out_trade_no}, 微信交易号=${transaction_id}, 金额=${total_fee / 100}元`);

      res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
    } else {
      res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>');
    }
  } catch (error) {
    console.error('微信支付回调处理错误:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统错误]]></return_msg></xml>');
  }
});

/**
 * 查询订单
 * GET /api/wechat/pay/query/:out_trade_no
 */
router.get('/query/:out_trade_no', async (req, res) => {
  try {
    const { out_trade_no } = req.params;
    const nonce_str = wxPayUtil.generateNonceStr();

    const params = {
      appid: envConfig.WECHAT_MINI_APPID,
      mch_id: WECHAT_PAY_MCHID,
      out_trade_no,
      nonce_str
    };

    params.sign = wxPayUtil.generateSign(params, WECHAT_PAY_APIKEY);

    const xmlData = wxPayUtil.objToXml(params);
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/orderquery', xmlData, {
      headers: { 'Content-Type': 'text/xml' }
    });

    const result = wxPayUtil.xmlToObj(response.data);

    if (result.return_code === 'SUCCESS') {
      res.json({
        success: true,
        data: {
          trade_state: result.trade_state,
          trade_state_desc: result.trade_state_desc,
          transaction_id: result.transaction_id,
          total_fee: result.total_fee ? result.total_fee / 100 : 0,
          cash_fee: result.cash_fee ? result.cash_fee / 100 : 0
        }
      });
    } else {
      res.status(400).json({ success: false, message: result.return_msg });
    }
  } catch (error) {
    console.error('查询订单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 申请退款
 * POST /api/wechat/pay/refund
 */
router.post('/refund', async (req, res) => {
  try {
    const { out_trade_no, total_fee, refund_fee, refund_desc = '正常退款' } = req.body;

    if (!out_trade_no || !total_fee || !refund_fee) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 退款需要商户证书，这里需要读取证书文件
    const certPath = path.join(__dirname, '../../certs/apiclient_cert.pem');
    const keyPath = path.join(__dirname, '../../certs/apiclient_key.pem');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      return res.status(400).json({ 
        success: false, 
        message: '商户证书未配置，请联系管理员' 
      });
    }

    const nonce_str = wxPayUtil.generateNonceStr();

    const params = {
      appid: envConfig.WECHAT_MINI_APPID,
      mch_id: WECHAT_PAY_MCHID,
      nonce_str,
      out_trade_no,
      out_refund_no: `REF${Date.now()}${nonce_str.substring(0, 6).toUpperCase()}`,
      total_fee: Math.round(total_fee * 100),
      refund_fee: Math.round(refund_fee * 100),
      refund_desc
    };

    params.sign = wxPayUtil.generateSign(params, WECHAT_PAY_APIKEY);

    const xmlData = wxPayUtil.objToXml(params);
    
    // 使用证书发起退款请求
    const response = await axios.post('https://api.mch.weixin.qq.com/secapi/pay/refund', xmlData, {
      headers: { 'Content-Type': 'text/xml' },
      httpsAgent: require('https').createAgent({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      })
    });

    const result = wxPayUtil.xmlToObj(response.data);

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      res.json({
        success: true,
        data: {
          refund_id: result.refund_id,
          out_refund_no: result.out_refund_no
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.err_code_des || '退款失败' 
      });
    }
  } catch (error) {
    console.error('申请退款错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
