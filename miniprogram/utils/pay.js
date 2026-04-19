/**
 * 微信支付 API
 */

const { request } = require('./request');

/**
 * 统一下单
 * @param {Object} params - 支付参数
 * @param {string} params.openid - 用户openid
 * @param {string} params.body - 商品描述
 * @param {number} params.total_fee - 支付金额（元）
 * @param {string} params.order_id - 业务订单号（可选）
 * @param {string} params.attach - 附加数据（可选）
 * @returns {Promise<Object>} - 支付参数
 */
async function unifiedOrder(params) {
  return request('/api/wechat/pay/unifiedorder', {
    method: 'POST',
    data: params
  });
}

/**
 * 查询订单支付状态
 * @param {string} outTradeNo - 商户订单号
 * @returns {Promise<Object>} - 订单状态
 */
async function queryOrder(outTradeNo) {
  return request(`/api/wechat/pay/query/${outTradeNo}`);
}

/**
 * 申请退款
 * @param {Object} params - 退款参数
 * @param {string} params.out_trade_no - 商户订单号
 * @param {number} params.total_fee - 订单金额（元）
 * @param {number} params.refund_fee - 退款金额（元）
 * @param {string} params.refund_desc - 退款原因
 * @returns {Promise<Object>} - 退款结果
 */
async function refund(params) {
  return request('/api/wechat/pay/refund', {
    method: 'POST',
    data: params
  });
}

module.exports = {
  unifiedOrder,
  queryOrder,
  refund
};
