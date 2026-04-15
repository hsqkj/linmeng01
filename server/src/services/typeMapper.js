/**
 * 统一类型映射服务
 * 
 * 解决痛点：
 * 1. 映射数据分散在多个地方（sys_configs、tags表、hardcode函数）
 * 2. 映射时机不确定，导致有时显示数字有时显示中文
 * 3. 返回格式不一致（数字、字符串、对象数组）
 * 
 * 解决方案：
 * 1. 启动时一次性加载所有映射数据到内存
 * 2. 后端返回数据时直接映射成可读文本
 * 3. 前端可以直接使用后端返回的可读字段
 */

const { pool } = require('../config/db')

// 内存中的映射缓存
let typeMaps = {
  // 需求类型
  demandTypes: [],
  // 资源类型
  resourceTypes: [],
  // 活动类型
  activityTypes: [],
  // 专家类型
  expertTypes: [],
  // 居民类型
  residentTypes: [],
  // 社区类型
  communityTypes: [],
  // 企业类型
  enterpriseTypes: [],
  // 行业分类
  industryTypes: [],
  // 社区标签
  communityTags: [],
  // 资源标签
  resourceTags: [],
  // 媒体类型
  mediaTypes: [],
  // 空间类型
  spaceTypes: [],
  // 合作方式
  cooperationTypes: [],
  // 品牌展示方式
  brandDisplayTypes: [],
  // 技术服务类型
  techServiceTypes: [],
  // 技术类型
  techTypes: [],
  // 专业服务类型
  professionalTypes: [],
}

// 映射索引（用于快速查找）
let typeIndices = {}

// 默认值映射（当数据库没有时使用）
const defaultMaps = {
  demandTypes: [
    { id: 0, name: '活动赞助' },
    { id: 1, name: '专家服务' },
    { id: 2, name: '空间运营' },
    { id: 3, name: '物资赞助' },
    { id: 4, name: '健康服务' },
    { id: 5, name: '教育培训' },
  ],
  resourceTypes: [
    { id: 0, name: '专业服务' },
    { id: 1, name: '教育培训' },
    { id: 2, name: '场地资源' },
    { id: 3, name: '物资捐赠' },
    { id: 4, name: '志愿服务' },
    { id: 5, name: '资金赞助' },
    { id: 6, name: '技术支持' },
    { id: 7, name: '健康医疗' },
    { id: 8, name: '活动赞助' },
    { id: 9, name: '媒体宣传' },
    { id: 10, name: '技能培训' },
    { id: 11, name: '养老服务' },
  ],
  activityTypes: [
    { id: 0, name: '节庆活动' },
    { id: 1, name: '体育健身' },
    { id: 2, name: '教育培训' },
    { id: 3, name: '健康养生' },
    { id: 4, name: '志愿服务' },
    { id: 5, name: '文化娱乐' },
    { id: 6, name: '便民服务' },
    { id: 7, name: '亲子活动' },
  ],
  expertTypes: [
    { id: 0, name: '法律专家' },
    { id: 1, name: '心理咨询师' },
    { id: 2, name: '健康管理师' },
    { id: 3, name: '家庭教育指导师' },
    { id: 4, name: '社区治理专家' },
    { id: 5, name: '艺术指导师' },
    { id: 6, name: '体育指导师' },
    { id: 7, name: '金融理财师' },
    { id: 8, name: '养老护理员' },
    { id: 9, name: '其他专家' },
  ],
  residentTypes: [
    { id: 0, name: '青少年' },
    { id: 1, name: '儿童' },
    { id: 2, name: '青年' },
    { id: 3, name: '中老年' },
    { id: 4, name: '退役军人' },
    { id: 5, name: '残障人士' },
    { id: 6, name: '新市民' },
  ],
  communityTypes: [
    { id: 0, name: '老旧小区' },
    { id: 1, name: '新建社区' },
    { id: 2, name: '亲子社区' },
    { id: 3, name: '老龄化社区' },
    { id: 4, name: '商务社区' },
    { id: 5, name: '混合社区' },
  ],
  communityTags: [
    { id: 0, name: '传统文化' },
    { id: 1, name: '体育健身' },
    { id: 2, name: '教育培训' },
    { id: 3, name: '健康养生' },
    { id: 4, name: '亲子活动' },
    { id: 5, name: '志愿服务' },
    { id: 6, name: '节庆活动' },
    { id: 7, name: '便民服务' },
    { id: 8, name: '社区治理' },
    { id: 9, name: '环境保护' },
  ],
  mediaTypes: [
    { id: 0, name: '微信公众号' },
    { id: 1, name: '抖音' },
    { id: 2, name: '小红书' },
    { id: 3, name: '视频号' },
    { id: 4, name: '微博' },
    { id: 5, name: '社区公告' },
  ],
  spaceTypes: [
    { id: 0, name: '会议室' },
    { id: 1, name: '活动室' },
    { id: 2, name: '运动场地' },
    { id: 3, name: '展览空间' },
    { id: 4, name: '教育培训室' },
    { id: 5, name: '休闲空间' },
  ],
  cooperationTypes: [
    { id: 0, name: '联合举办' },
    { id: 1, name: '赞助支持' },
    { id: 2, name: '资源共享' },
    { id: 3, name: '项目合作' },
    { id: 4, name: '长期合作' },
  ],
  brandDisplayTypes: [
    { id: 0, name: 'LOGO展示' },
    { id: 1, name: '横幅展示' },
    { id: 2, name: '现场宣传' },
    { id: 3, name: '社交媒体' },
    { id: 4, name: '物料赞助' },
  ],
  professionalTypes: [
    { id: 0, name: '法律咨询' },
    { id: 1, name: '心理咨询' },
    { id: 2, name: '财务审计' },
    { id: 3, name: '营销策划' },
    { id: 4, name: '技术开发' },
    { id: 5, name: '品牌设计' },
    { id: 6, name: '活动执行' },
    { id: 7, name: '其他服务' },
  ],
  techTypes: [
    { id: 0, name: '软件开发' },
    { id: 1, name: '小程序开发' },
    { id: 2, name: '网站开发' },
    { id: 3, name: '数据分析' },
    { id: 4, name: 'AI人工智能' },
    { id: 5, name: '云计算' },
    { id: 6, name: '网络安全' },
    { id: 7, name: '其他技术' },
  ],
  techServiceTypes: [
    { id: 0, name: '开发服务' },
    { id: 1, name: '运维服务' },
    { id: 2, name: '培训服务' },
    { id: 3, name: '咨询服务' },
  ],
}

/**
 * 初始化映射服务
 * 从数据库加载所有映射数据
 */
async function initialize() {
  console.log('[TypeMapper] 正在初始化类型映射服务...')
  
  try {
    await loadAllTypeMaps()
    buildIndices()
    console.log('[TypeMapper] 类型映射服务初始化完成')
  } catch (err) {
    console.error('[TypeMapper] 初始化失败:', err)
    // 使用默认值
    typeMaps = { ...defaultMaps }
    buildIndices()
  }
}

/**
 * 从数据库加载所有映射数据
 */
async function loadAllTypeMaps() {
  try {
    // 1. 从 sys_configs 加载基本类型配置
    const [configRows] = await pool.query("SELECT config_key, config_value FROM sys_configs WHERE config_key IN ('basic_types', 'expert_types')")
    
    const configMap = {}
    for (const row of configRows) {
      try {
        configMap[row.config_key] = JSON.parse(row.config_value)
      } catch (e) {
        configMap[row.config_key] = null
      }
    }
    
    // 解析 basic_types
    const basicTypes = configMap.basic_types || {}
    typeMaps.demandTypes = parseTypeArray(basicTypes.demandTypes) || defaultMaps.demandTypes
    typeMaps.resourceTypes = parseTypeArray(basicTypes.resourceTypes) || defaultMaps.resourceTypes
    typeMaps.activityTypes = parseTypeArray(basicTypes.activityTypes) || defaultMaps.activityTypes
    typeMaps.residentTypes = parseTypeArray(basicTypes.residentTypes) || defaultMaps.residentTypes
    typeMaps.communityTypes = parseTypeArray(basicTypes.communityTypes) || defaultMaps.communityTypes
    typeMaps.industryTypes = parseTypeArray(basicTypes.industryTypes) || []
    typeMaps.enterpriseTypes = parseTypeArray(basicTypes.enterpriseTypes) || []
    typeMaps.mediaTypes = parseTypeArray(basicTypes.mediaTypes) || defaultMaps.mediaTypes
    typeMaps.spaceTypes = parseTypeArray(basicTypes.spaceTypes) || defaultMaps.spaceTypes
    typeMaps.cooperationTypes = parseTypeArray(basicTypes.cooperationTypes) || defaultMaps.cooperationTypes
    typeMaps.brandDisplayTypes = parseTypeArray(basicTypes.brandDisplayTypes) || defaultMaps.brandDisplayTypes
    typeMaps.professionalTypes = parseTypeArray(basicTypes.professionalTypes) || defaultMaps.professionalTypes
    typeMaps.techTypes = parseTypeArray(basicTypes.techTypes) || defaultMaps.techTypes
    typeMaps.techServiceTypes = parseTypeArray(basicTypes.techServiceTypes) || defaultMaps.techServiceTypes
    
    // 解析 expert_types
    const expertTypes = configMap.expert_types || {}
    if (expertTypes.types) {
      typeMaps.expertTypes = parseTypeArray(expertTypes.types) || defaultMaps.expertTypes
    }
    
    // 2. 从 tags 表加载标签
    const [tagRows] = await pool.query("SELECT id, name, type FROM tags WHERE status = 1")
    
    // 按 type 分组
    const tagMap = {}
    for (const tag of tagRows) {
      if (!tagMap[tag.type]) {
        tagMap[tag.type] = []
      }
      tagMap[tag.type].push({ id: tag.id, name: tag.name })
    }
    
    // tags 表中 type 是数字：1=社区标签, 2=商家标签, 3=行业标签
    typeMaps.communityTags = tagMap['1'] || defaultMaps.communityTags
    typeMaps.resourceTags = tagMap['2'] || []
    typeMaps.industryTags = tagMap['3'] || []
    
    // 如果社区标签为空，使用默认值
    if (typeMaps.communityTags.length === 0) {
      typeMaps.communityTags = defaultMaps.communityTags
    }
    
    console.log('[TypeMapper] 已加载映射数据:')
    console.log(`  - 需求类型: ${typeMaps.demandTypes.length} 个`)
    console.log(`  - 资源类型: ${typeMaps.resourceTypes.length} 个`)
    console.log(`  - 活动类型: ${typeMaps.activityTypes.length} 个`)
    console.log(`  - 专家类型: ${typeMaps.expertTypes.length} 个`)
    console.log(`  - 居民类型: ${typeMaps.residentTypes.length} 个`)
    console.log(`  - 社区标签: ${typeMaps.communityTags.length} 个`)
    
  } catch (err) {
    console.error('[TypeMapper] 加载映射数据失败:', err)
    throw err
  }
}

/**
 * 解析类型数组（兼容多种格式）
 * @param {Array} arr - 原始数组
 * @returns {Array} 标准化后的数组
 */
function parseTypeArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return null
  }
  
  // 检查是否是字符串数组（如 ["活动赞助", "专家服务"]）
  if (typeof arr[0] === 'string') {
    return arr.map((name, index) => ({ id: index, name }))
  }
  
  // 检查是否是对象数组
  return arr.map((item, index) => {
    // 有 id 字段，使用 id
    if (item.id !== undefined) {
      return { id: item.id, name: item.name || item.label || item.text || '' }
    }
    // 有 value 字段，使用 value 作为 id
    if (item.value !== undefined) {
      return { id: item.value, name: item.name || item.label || item.text || '' }
    }
    // 没有 id/value 字段，使用数组索引作为 id
    return { id: index, name: item.name || item.label || item.text || '' }
  }).filter(item => item.name)
}

/**
 * 构建索引（用于快速查找）
 */
function buildIndices() {
  typeIndices = {}
  
  for (const [key, arr] of Object.entries(typeMaps)) {
    if (Array.isArray(arr)) {
      typeIndices[key] = {}
      for (const item of arr) {
        // 同时支持 id 和 name 作为索引
        if (item.id !== undefined) {
          typeIndices[key][item.id] = item.name
        }
        if (item.name) {
          typeIndices[key][item.name] = item.name
        }
      }
    }
  }
}

/**
 * 根据 ID 获取类型名称
 * @param {string} typeKey - 类型键名
 * @param {number|string} id - ID
 * @returns {string} 类型名称
 */
function getTypeName(typeKey, id) {
  if (id === null || id === undefined || id === '') {
    return ''
  }
  
  const index = typeIndices[typeKey]
  if (!index) {
    return String(id)
  }
  
  // 尝试直接查找
  if (index[id] !== undefined) {
    return index[id]
  }
  
  // 尝试转换为数字查找
  const numId = parseInt(id, 10)
  if (!isNaN(numId) && index[numId] !== undefined) {
    return index[numId]
  }
  
  // 未找到，返回原始值
  return String(id)
}

/**
 * 根据 ID 数组获取名称数组
 * @param {string} typeKey - 类型键名
 * @param {Array} ids - ID 数组
 * @returns {Array} 名称数组
 */
function getTypeNames(typeKey, ids) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return []
  }
  
  return ids.map(id => getTypeName(typeKey, id)).filter(name => name)
}

/**
 * 映射需求数据
 * @param {Object} demand - 需求对象
 * @returns {Object} 映射后的需求对象
 */
function mapDemand(demand) {
  if (!demand) return demand
  
  const mapped = { ...demand }
  
  // 需求类型名称
  if (mapped.demand_type !== undefined) {
    mapped.demand_type_name = getTypeName('demandTypes', mapped.demand_type)
  }
  
  // 目标人群名称
  if (mapped.target_audience) {
    const audiences = typeof mapped.target_audience === 'string' 
      ? JSON.parse(mapped.target_audience || '[]') 
      : mapped.target_audience
    mapped.target_audience_names = getTypeNames('residentTypes', audiences)
  }
  
  // 标签名称
  if (mapped.tags) {
    const tags = typeof mapped.tags === 'string' 
      ? JSON.parse(mapped.tags || '[]') 
      : mapped.tags
    mapped.tags_names = getTypeNames('communityTags', tags)
  }
  
  // 活动类型名称
  if (mapped.activity_type !== undefined) {
    mapped.activity_type_name = getTypeName('activityTypes', mapped.activity_type)
  }
  
  return mapped
}

/**
 * 映射资源数据
 * @param {Object} resource - 资源对象
 * @returns {Object} 映射后的资源对象
 */
function mapResource(resource) {
  if (!resource) return resource
  
  const mapped = { ...resource }
  
  // 资源类型名称
  if (mapped.resource_type !== undefined) {
    mapped.resource_type_name = getTypeName('resourceTypes', mapped.resource_type)
  }
  
  // 专家类型名称
  if (mapped.expert_type !== undefined) {
    mapped.expert_type_name = getTypeName('expertTypes', mapped.expert_type)
  }
  
  // 专业服务类型名称
  if (mapped.professional_type !== undefined) {
    mapped.professional_type_name = getTypeName('professionalTypes', mapped.professional_type)
  }
  
  // 技术类型名称
  if (mapped.tech_types) {
    const techTypes = typeof mapped.tech_types === 'string' 
      ? JSON.parse(mapped.tech_types || '[]') 
      : mapped.tech_types
    mapped.tech_types_names = getTypeNames('techTypes', techTypes)
  }
  
  // 媒体渠道名称
  if (mapped.media_channels) {
    const channels = typeof mapped.media_channels === 'string' 
      ? JSON.parse(mapped.media_channels || '[]') 
      : mapped.media_channels
    mapped.media_channels_names = getTypeNames('mediaTypes', channels)
  }
  
  // 期望回报类型名称
  if (mapped.expected_rewards) {
    const rewards = typeof mapped.expected_rewards === 'string' 
      ? JSON.parse(mapped.expected_rewards || '[]') 
      : mapped.expected_rewards
    mapped.expected_rewards_names = getTypeNames('cooperationTypes', rewards)
  }
  
  // 标签名称
  if (mapped.tags) {
    const tags = typeof mapped.tags === 'string' 
      ? JSON.parse(mapped.tags || '[]') 
      : mapped.tags
    mapped.tags_names = getTypeNames('resourceTags', tags)
  }
  
  return mapped
}

/**
 * 映射需求列表
 * @param {Array} demands - 需求数组
 * @returns {Array} 映射后的需求数组
 */
function mapDemandList(demands) {
  if (!Array.isArray(demands)) return demands
  return demands.map(d => mapDemand(d))
}

/**
 * 映射资源列表
 * @param {Array} resources - 资源数组
 * @returns {Array} 映射后的资源数组
 */
function mapResourceList(resources) {
  if (!Array.isArray(resources)) return resources
  return resources.map(r => mapResource(r))
}

/**
 * 获取所有映射数据（供前端使用）
 */
function getAllTypeMaps() {
  return { ...typeMaps }
}

/**
 * 获取特定类型的映射数据
 */
function getTypeMap(typeKey) {
  return typeMaps[typeKey] || []
}

/**
 * 刷新映射数据（从数据库重新加载）
 */
async function refresh() {
  console.log('[TypeMapper] 正在刷新映射数据...')
  await loadAllTypeMaps()
  buildIndices()
  console.log('[TypeMapper] 映射数据刷新完成')
}

// ============ 导出 ============

module.exports = {
  initialize,
  refresh,
  getTypeName,
  getTypeNames,
  getAllTypeMaps,
  getTypeMap,
  mapDemand,
  mapResource,
  mapDemandList,
  mapResourceList,
}
