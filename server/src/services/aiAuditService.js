/**
 * AI 审核服务
 * 功能：内容安全检测、质量评估、自动分类
 */

const axios = require('axios')

// 敏感词库（本地基础敏感词检测）
const SENSITIVE_WORDS = [
  '赌博', '色情', '毒品', '枪支', '诈骗', '传销', '政治敏感',
  '反动', '暴恐', '邪教', '外挂', '木马', '病毒'
]

// 广告关键词
const AD_KEYWORDS = [
  '最便宜', '全网最低', '限时特价', '立即购买', '点击获取',
  '赚钱', '日赚', '月入', '躺赚', '稳赚'
]

class AIAuditService {
  constructor() {
    // 可以接入阿里云/腾讯云内容安全API
    this.useCloudAPI = false // 暂未配置云服务
    this.mockMode = true // 使用本地模拟模式
  }

  /**
   * 审核资源/需求内容
   * @param {Object} content - 待审核内容
   * @returns {Object} 审核结果
   */
  async auditContent(content) {
    const { title, description, type } = content

    // 第一层：本地敏感词检测
    const localCheck = this.localSensitiveCheck(title, description)
    if (localCheck.flagged) {
      return {
        passed: false,
        reason: localCheck.reason,
        level: 'high',
        suggestions: localCheck.suggestions
      }
    }

    // 第二层：内容质量评估
    const qualityScore = this.assessQuality(title, description)

    // 第三层：分类检测
    const categoryCheck = this.detectCategory(title, description)

    // 综合评估
    const result = this.comprehensiveEval(localCheck, qualityScore, categoryCheck)

    // 如果启用云API，可以调用阿里云/腾讯云内容安全
    if (this.useCloudAPI) {
      try {
        const cloudResult = await this.callCloudAudit(title, description)
        if (!cloudResult.passed) {
          return cloudResult
        }
      } catch (e) {
        console.error('Cloud audit failed, use local result:', e)
      }
    }

    return result
  }

  /**
   * 本地敏感词检测
   */
  localSensitiveCheck(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    const flagged = []
    const suggestions = []

    // 检测敏感词
    for (const word of SENSITIVE_WORDS) {
      if (text.includes(word)) {
        flagged.push(`敏感词：${word}`)
        suggestions.push(`请修改或删除涉及"${word}"的内容`)
      }
    }

    // 检测广告词
    for (const keyword of AD_KEYWORDS) {
      if (text.includes(keyword)) {
        flagged.push(`广告词：${keyword}`)
      }
    }

    if (flagged.length > 0) {
      return {
        flagged: true,
        reason: `检测到以下问题：${flagged.join('；')}`,
        suggestions
      }
    }

    return { flagged: false, reason: null, suggestions: [] }
  }

  /**
   * 内容质量评估
   */
  assessQuality(title, description) {
    let score = 0
    const factors = []

    // 标题长度检查
    if (title && title.length >= 5) {
      score += 25
      factors.push('标题长度合格')
    } else {
      factors.push('标题过短，建议至少5个字')
    }

    // 描述长度检查
    if (description && description.length >= 20) {
      score += 25
      factors.push('描述内容充分')
    } else {
      factors.push(`描述内容偏少，建议至少20字（当前${description?.length || 0}字）`)
    }

    // 是否有联系方式
    const phoneRegex = /1[3-9]\d{9}/g
    const hasPhone = phoneRegex.test(`${title} ${description}`)
    if (hasPhone) {
      score -= 20
      factors.push('⚠️ 包含手机号，可能存在引流风险')
    }

    // 是否有链接
    const urlRegex = /(http|https|www\.)[^\s]+/gi
    const hasUrl = urlRegex.test(`${title} ${description}`)
    if (hasUrl) {
      score -= 15
      factors.push('⚠️ 包含外部链接')
    }

    // 是否有完整信息
    if (description && description.length >= 100) {
      score += 25
      factors.push('内容详细完整')
    }

    // 是否有具体数据
    const hasNumbers = /\d+/.test(description || '')
    if (hasNumbers) {
      score += 25
      factors.push('包含具体数据或金额')
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      passed: score >= 60
    }
  }

  /**
   * 内容分类检测
   */
  detectCategory(title, description) {
    const text = `${title} ${description}`

    // 虚假信息检测关键词
    const fakeKeywords = ['假货', '高仿', 'A货', '原单', '尾货', '工厂价']
    const hasFake = fakeKeywords.some(k => text.includes(k))

    // 金融诈骗相关
    const financeKeywords = ['投资', '理财', '返利', '分红', '佣金', '代理']
    const hasFinance = financeKeywords.some(k => text.includes(k))

    // 招聘诈骗相关
    const jobKeywords = ['兼职', '刷单', '打字', '快递录入', '在家赚钱']
    const hasJob = jobKeywords.some(k => text.includes(k))

    return {
      suspicious: hasFake || hasFinance || hasJob,
      reasons: [
        hasFake ? '可能涉及假冒商品' : null,
        hasFinance ? '可能涉及金融风险' : null,
        hasJob ? '可能涉及兼职诈骗' : null
      ].filter(Boolean)
    }
  }

  /**
   * 综合评估
   */
  comprehensiveEval(localCheck, qualityScore, categoryCheck) {
    let passed = true
    let level = 'low'
    let reason = '内容审核通过'

    // 高风险：敏感词
    if (localCheck.flagged) {
      passed = false
      level = 'high'
      reason = localCheck.reason
    }
    // 中风险：质量差或可疑分类
    else if (categoryCheck.suspicious || !qualityScore.passed) {
      passed = true // 标记为待人工复核
      level = 'medium'
      reason = categoryCheck.suspicious
        ? `内容需要人工复核：${categoryCheck.reasons.join('；')}`
        : `内容质量待提升：${qualityScore.factors.filter(f => f.startsWith('⚠️') || f.startsWith('标题') || f.startsWith('描述')).join('；')}`
    }
    // 低风险：质量评估因子中有警告
    else if (qualityScore.factors.some(f => f.startsWith('⚠️'))) {
      passed = true
      level = 'low'
      reason = `审核通过（建议关注）：${qualityScore.factors.filter(f => f.startsWith('⚠️')).join('；')}`
    }

    return {
      passed,
      level,
      reason,
      qualityScore: qualityScore.score,
      factors: qualityScore.factors,
      suggestions: localCheck.suggestions.length > 0
        ? localCheck.suggestions
        : qualityScore.factors.filter(f => !f.startsWith('⚠️'))
    }
  }

  /**
   * 调用云端内容安全API（预留接口）
   */
  async callCloudAudit(title, description) {
    // 阿里云内容安全 API
    // const response = await axios.post('https://green.cn-shanghai.aliyuncs.com/green/text/scan', {
    //   queries: [{ content: `${title} ${description}` }]
    // }, {
    //   headers: { 'Authorization': `Bearer ${process.env.ALIYUN_TOKEN}` }
    // })

    // 腾讯云内容安全 API
    // const response = await axios.post('https://audit.api.qcloud.com/v2/index.php', {
    //   content: `${title} ${description}`
    // }, {
    //   params: { Action: 'TextModeration' }
    // })

    return { passed: true }
  }

  /**
   * 批量审核
   */
  async batchAudit(items) {
    const results = []
    for (const item of items) {
      const result = await this.auditContent(item)
      results.push({
        id: item.id,
        ...result
      })
    }
    return results
  }
}

module.exports = new AIAuditService()
