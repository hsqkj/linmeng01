/**
 * 匹配算法工具
 */

// 计算匹配度
function calculateMatchScore(demand, resource, config) {
  // 解析配置
  const weights = JSON.parse(config || '{"region":25,"type":20,"tag":15,"community_profile":15,"merchant_profile":10,"semantic":10,"reputation":5}')
  
  let totalScore = 0
  let totalWeight = 0
  
  // 1. 地域匹配（假设已有地理位置数据）
  if (weights.region > 0) {
    const regionScore = 80 // 默认分数
    totalScore += regionScore * (weights.region / 100)
    totalWeight += weights.region
  }
  
  // 2. 类型匹配
  if (weights.type > 0 && demand.demand_type && resource.resource_type) {
    const typeScore = demand.demand_type === resource.resource_type ? 100 : 50
    totalScore += typeScore * (weights.type / 100)
    totalWeight += weights.type
  }
  
  // 3. 标签匹配
  if (weights.tag > 0) {
    const demandTags = JSON.parse(demand.tags || '[]')
    const resourceTags = JSON.parse(resource.tags || '[]')
    const commonTags = demandTags.filter(t => resourceTags.includes(t))
    const tagScore = demandTags.length > 0 
      ? (commonTags.length / demandTags.length) * 100 
      : 50
    totalScore += tagScore * (weights.tag / 100)
    totalWeight += weights.tag
  }
  
  // 4-7. 其他维度简化处理
  if (weights.reputation > 0) {
    const repScore = resource.star_rating ? (resource.star_rating / 5) * 100 : 70
    totalScore += repScore * (weights.reputation / 100)
    totalWeight += weights.reputation
  }
  
  // 计算最终分数
  const finalScore = totalWeight > 0 ? (totalScore / totalWeight * 100) : 70
  return Math.min(100, Math.max(0, finalScore))
}

// 获取匹配度等级（红心数）
function getMatchHearts(score) {
  if (score >= 90) return 5
  if (score >= 75) return 4
  if (score >= 60) return 3
  if (score >= 45) return 2
  return 1
}

module.exports = {
  calculateMatchScore,
  getMatchHearts
}
