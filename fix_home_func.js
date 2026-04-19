#!/usr/bin/env node
const fs = require('fs');
const content = fs.readFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', 'utf8');

// 新的 getHome 函数
const newGetHome = `// 商家首页数据
exports.getHome = async (req, res) => {
  try {
    const merchantId = req.merchant.id

    // 获取商家信息
    const [merchantRows] = await pool.query(
      'SELECT m.*, (SELECT MAX(end_date) FROM member_payments WHERE merchant_id = m.id AND status = 1) as member_expire_at FROM merchants m WHERE m.id = ?',
      [merchantId]
    )

    if (merchantRows.length === 0) {
      return error(res, '用户不存在', 404)
    }

    const merchant = merchantRows[0]

    // 获取统计数据
    const [stats] = await pool.query(
      'SELECT (SELECT COUNT(*) FROM resources WHERE merchant_id = ? AND status = 1) as resourceCount, (SELECT COUNT(*) FROM intentions WHERE merchant_id = ? AND status = 1) as intentionCount, (SELECT COUNT(*) FROM intentions WHERE merchant_id = ? AND status = 2) as completedCount, (SELECT COUNT(*) FROM demands WHERE status = 1) as totalDemands, (SELECT COUNT(*) FROM resources WHERE status = 1) as totalResources',
      [merchantId, merchantId, merchantId]
    )

    const stat = stats[0]

    // 解析JSON字段
    if (typeof merchant.resource_types === 'string') {
      try { merchant.resource_types = JSON.parse(merchant.resource_types) } catch {}
    }
    if (typeof merchant.tags === 'string') {
      try { merchant.tags = JSON.parse(merchant.tags) } catch {}
    }

    // 删除密码
    delete merchant.password

    success(res, {
      ...merchant,
      ...stat,
      member_expire_at: stat.member_expire_at
    })
  } catch (err) {
    console.error('getHome error:', err)
    error(res, '获取首页数据失败')
  }
}`;

// 使用正则表达式替换 getHome 函数
const pattern = /\/\/ 商家首页数据[\s\S]*?\/\/ M-eM-\^HM- M-iM-\^YM-\$M-eM-\/\/\^FM-gM- M-\^A[\s\S]*?success\(res, \{[\s\S]*?error\(res, 'M-hM-\^NM-7M-eM-\^OM-\^VM-iM-&M-\^VM-iM-!M-5M-fM-\^UM-0M-fM-\^MM-\.M-eM-\$M-1M-hM-4M-%'\)\s+}\s+}\n}/;

if (pattern.test(content)) {
  const newContent = content.replace(pattern, newGetHome);
  fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', newContent);
  console.log('getHome 函数已修复！');
} else {
  console.log('未找到 getHome 函数，尝试其他方法...');
  // 尝试更简单的模式
  const simplePattern = /\/\/ 商家首页数据[\s\S]*?exports\.getHome = async[\s\S]*?error\(res, '获取首页数据失败'\)\s+}\s+}\n}/;
  if (simplePattern.test(content)) {
    const newContent = content.replace(simplePattern, newGetHome);
    fs.writeFileSync('/var/www/linmeng/server/src/controllers/merchantController.js', newContent);
    console.log('getHome 函数已修复！（简单模式）');
  } else {
    console.log('无法找到 getHome 函数');
  }
}
