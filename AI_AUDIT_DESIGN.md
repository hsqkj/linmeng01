# AI审核机制设计方案

## 一、概述

邻盟平台的AI审核机制旨在利用人工智能技术自动化审核商家发布的需求和资源，减少人工审核工作量，提高审核效率和一致性。

## 二、AI审核流程

```
商家发布需求/资源
       ↓
系统预审（基础校验：格式、内容完整性）
       ↓
AI预审（调用AI服务进行内容分析）
       ↓
  ├── AI通过 → 自动审核通过
  ├── AI存疑 → 转人工复审（标记黄色警告）
  └── AI拒绝 → 自动拒绝或转人工复审（标记红色警告）
       ↓
人工复审（如有需要）
       ↓
审核结果通知
```

## 三、AI审核维度

### 1. 内容合规性审核
- **敏感词检测**：识别政治敏感、色情低俗、暴力恐怖等内容
- **违规信息检测**：识别广告推销、联系方式（手机号、微信号）等违规内容
- **违禁品类检测**：识别平台禁止的行业或商品

### 2. 内容质量审核
- **信息完整性**：标题、描述、图片等是否完整
- **内容真实性**：图片是否清晰、描述是否合理
- **商业价值评估**：内容是否符合平台定位

### 3. 风险评估
- **欺诈风险**：识别虚假宣传、夸大其词的内容
- **法律风险**：识别可能涉及侵权、虚假广告的内容
- **平台违规**：识别违反平台规则的内容

## 四、AI服务接入方案

### 方案一：接入腾讯云内容审核服务

**推荐理由**：腾讯云内容审核提供一站式解决方案，支持文本、图片、音视频审核，且与微信生态深度集成。

```javascript
// 后端接入示例
const tencentcloud = require('tencentcloud-sdk-nodejs')

// 文本审核
async function aiTextReview(text) {
  const client = new tencentcloud.tms.v20200713.Client({
    credential: { secretId: process.env.TENCENT_SECRET_ID, secretKey: process.env.TENCENT_SECRET_KEY },
    region: 'ap-guangzhou'
  })

  const result = await client.TextModeration({ Content: Buffer.from(text).toString('base64') })
  return {
    pass: result.Suggestion === 'Pass',
    label: result.Label,
    confidence: result.Score,
    suggestion: result.Suggestion
  }
}

// 图片审核
async function aiImageReview(imageUrl) {
  // 下载图片后调用审核
  const client = new tencentcloud.tms.v20200713.Client({...})
  return await client.ImageModeration({ FileUrl: imageUrl })
}
```

**费用预估**：
- 文本审核：¥0.72/千次
- 图片审核：¥1.00/千次
- 每月1万次调用约 ¥50-100

### 方案二：接入阿里云内容安全

```javascript
// 阿里云内容安全
const AliYun = require('@alicloud/pop-core')

async function aiTextReview(text) {
  const client = new AliYun({
    endpoint: '绿网.cn-shanghai.aliyuncs.com',
    apiVersion: '2017-03-21',
    accessKeyId: process.env.ALI_ACCESS_KEY,
    accessKeySecret: process.env.ALI_SECRET_KEY
  })

  const result = await client.request('TextModeration', {
    Text: text,
    Labels: 'politics,terrorism,pornography,ad,abuse',
    Scene: 'comment'
  })

  return {
    pass: result.Data.Label === 'pass',
    label: result.Data.Label,
    confidence: result.Data.Rate
  }
}
```

### 方案三：自建AI审核模型（适合长期发展）

使用开源模型如：
- **文本**：RoBERTa-base + 微调的有害内容分类器
- **图片**：ResNet50 + 微调的NSFW检测模型

```python
# 自建AI审核示例
from transformers import pipeline

text_classifier = pipeline("text-classification", model="uer/roberta-base-finetuned-chinanews-chinese")

def ai_review(text):
    result = text_classifier(text)[0]
    # 返回审核结果
    return {
        'label': result['label'],
        'score': result['score'],
        'suggestion': 'pass' if result['score'] < 0.7 else 'review'
    }
```

## 五、后端实现架构

### 数据库表设计

```sql
-- AI审核配置表
CREATE TABLE ai_audit_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scene VARCHAR(50) NOT NULL COMMENT '审核场景：demand/resource/comment',
  enabled TINYINT DEFAULT 1 COMMENT '是否启用AI审核',
  auto_pass TINYINT DEFAULT 0 COMMENT 'AI通过后是否自动通过',
  auto_reject TINYINT DEFAULT 0 COMMENT 'AI拒绝后是否自动拒绝',
  risk_threshold INT DEFAULT 80 COMMENT '风险阈值',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 审核记录表
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  target_type VARCHAR(20) NOT NULL COMMENT '审核对象类型：demand/resource/comment',
  target_id INT NOT NULL COMMENT '审核对象ID',
  audit_type VARCHAR(20) NOT NULL COMMENT '审核方式：ai/manual',
  result VARCHAR(20) NOT NULL COMMENT '审核结果：pass/reject/review',
  risk_score INT COMMENT 'AI风险评分',
  risk_labels JSON COMMENT 'AI识别的风险标签',
  ai_suggestion VARCHAR(50) COMMENT 'AI建议',
  auditor_id INT COMMENT '人工审核员ID',
  auditor_comment VARCHAR(500) COMMENT '审核备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id),
  INDEX idx_audit_type (audit_type),
  INDEX idx_created (created_at)
);
```

### 后端API实现

```javascript
// server/src/services/aiAuditService.js

class AiAuditService {
  constructor() {
    this.client = null
    this.config = {
      enabled: process.env.AI_AUDIT_ENABLED === 'true',
      provider: process.env.AI_PROVIDER || 'simulated', // simulated/tencent/ali
      autoPassThreshold: 20,  // 风险分 < 20 自动通过
      autoRejectThreshold: 80 // 风险分 > 80 自动拒绝
    }
  }

  // 初始化AI客户端
  async init() {
    if (this.config.provider === 'tencent') {
      // 初始化腾讯云客户端
    } else if (this.config.provider === 'ali') {
      // 初始化阿里云客户端
    }
  }

  // 审核文本内容
  async reviewText(text) {
    if (!this.config.enabled) {
      return { suggestion: 'review', score: 0, labels: [], provider: 'disabled' }
    }

    try {
      if (this.config.provider === 'simulated') {
        return this.simulatedReview(text)
      } else if (this.config.provider === 'tencent') {
        return await this.tencentReview(text)
      }
    } catch (error) {
      console.error('AI审核失败:', error)
      return { suggestion: 'review', score: 50, labels: ['审核服务异常'], provider: 'error' }
    }
  }

  // 模拟审核（用于开发和测试）
  simulatedReview(text) {
    const risks = []
    let score = 0

    // 敏感词检测
    const sensitiveWords = ['色情', '暴力', '反动', '赌博']
    for (const word of sensitiveWords) {
      if (text.includes(word)) {
        risks.push({ label: 'sensitive', word, severity: 'high' })
        score += 30
      }
    }

    // 联系方式检测
    const phoneRegex = /1[3-9]\d{9}/g
    const wechatRegex = /微信|wechat|微信号/g
    if (phoneRegex.test(text) || wechatRegex.test(text)) {
      risks.push({ label: 'contact', severity: 'medium' })
      score += 20
    }

    // 广告检测
    const adWords = ['最便宜', '全网最低', '限时特价']
    for (const word of adWords) {
      if (text.includes(word)) {
        risks.push({ label: 'ad', severity: 'low' })
        score += 10
      }
    }

    // 内容长度检测
    if (text.length < 10) {
      risks.push({ label: 'content_too_short', severity: 'medium' })
      score += 15
    }

    // 确定审核建议
    let suggestion = 'review'
    if (score < this.config.autoPassThreshold) {
      suggestion = 'pass'
    } else if (score > this.config.autoRejectThreshold) {
      suggestion = 'reject'
    }

    return {
      suggestion,
      score: Math.min(score, 100),
      labels: risks.map(r => r.label),
      details: risks,
      provider: 'simulated'
    }
  }

  // 综合审核需求/资源
  async reviewDemand(demand) {
    const text = `${demand.title} ${demand.description} ${demand.target_audience || ''}`
    const textResult = await this.reviewText(text)

    // 如果包含图片，也审核图片
    let imageResult = null
    if (demand.images && demand.images.length > 0) {
      for (const img of demand.images) {
        // imageResult = await this.reviewImage(img)
        // 累加图片风险分
      }
    }

    // 综合评分
    const finalScore = textResult.score + (imageResult?.score || 0)
    const allLabels = [...textResult.labels, ...(imageResult?.labels || [])]

    let finalSuggestion = 'review'
    if (finalScore < this.config.autoPassThreshold) {
      finalSuggestion = 'pass'
    } else if (finalScore > this.config.autoRejectThreshold) {
      finalSuggestion = 'reject'
    }

    return {
      suggestion: finalSuggestion,
      score: Math.min(finalScore, 100),
      labels: allLabels,
      textResult,
      imageResult,
      provider: textResult.provider
    }
  }
}

module.exports = new AiAuditService()
```

### 集成到审核流程

```javascript
// server/src/controllers/adminController.js
const aiAuditService = require('../services/aiAuditService')

exports.getDemandAuditList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query

    // 获取待审核列表（status=0的需求）
    const [demands] = await pool.query(`
      SELECT d.*, c.community_name
      FROM demands d
      LEFT JOIN communities c ON d.community_id = c.id
      WHERE d.status = ?
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?`,
      [status || 0, parseInt(pageSize), (page - 1) * pageSize]
    )

    // 对每个需求进行AI预审
    for (const demand of demands) {
      if (!demand.ai_review_result) {
        const aiResult = await aiAuditService.reviewDemand(demand)
        // 缓存AI审核结果
        demand.ai_suggestion = aiResult.suggestion
        demand.ai_risk_score = aiResult.score
        demand.ai_labels = aiResult.labels
      }
    }

    success(res, { list: demands, pagination: {...} })
  } catch (err) {
    error(res, '获取审核列表失败')
  }
}

exports.passDemand = async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body

    await pool.query(
      'UPDATE demands SET status = 1, audit_comment = ?, audited_at = NOW(), auditor_id = ? WHERE id = ?',
      [comment || '', req.admin.id, id]
    )

    // 记录审核日志
    await pool.query(
      'INSERT INTO audit_logs (target_type, target_id, audit_type, result, auditor_id, auditor_comment) VALUES (?, ?, ?, ?, ?, ?)',
      ['demand', id, 'manual', 'pass', req.admin.id, comment]
    )

    // 发送审核通过通知
    // ...

    success(res, null, '审核通过')
  } catch (err) {
    error(res, '审核失败')
  }
}
```

## 六、前端实现

### 管理后台AI审核页面

```vue
<!-- admin/AiAudit.vue -->
<template>
  <div class="ai-audit-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>AI审核配置</span>
          <el-switch v-model="aiConfig.enabled" @change="saveConfig" />
        </div>
      </template>

      <el-form :model="aiConfig" label-width="140px">
        <el-form-item label="AI审核服务">
          <el-select v-model="aiConfig.provider" @change="saveConfig">
            <el-option label="模拟模式（测试用）" value="simulated" />
            <el-option label="腾讯云内容安全" value="tencent" />
            <el-option label="阿里云内容安全" value="ali" />
          </el-select>
        </el-form-item>

        <el-form-item label="自动通过阈值">
          <el-slider v-model="aiConfig.autoPassThreshold" :min="0" :max="50" :step="5" show-stops />
          <span>风险分低于此值自动通过</span>
        </el-form-item>

        <el-form-item label="自动拒绝阈值">
          <el-slider v-model="aiConfig.autoRejectThreshold" :min="50" :max="100" :step="5" show-stops />
          <span>风险分高于此值自动拒绝</span>
        </el-form-item>

        <el-form-item label="今日审核统计">
          <el-statistic title="AI已审核" :value="stats.aiCount" />
          <el-statistic title="自动通过" :value="stats.autoPassCount" />
          <el-statistic title="转人工" :value="stats.manualCount" />
          <el-statistic title="准确率" :value="stats.accuracy + '%'" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="audit-list">
      <template #header>
        <span>待复审列表</span>
      </template>

      <el-table :data="reviewList">
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.target_type === 'demand' ? 'warning' : 'success'" size="small">
              {{ row.target_type === 'demand' ? '需求' : '资源' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="内容" prop="title" />

        <el-table-column label="AI风险" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.ai_risk_score"
              :color="getRiskColor(row.ai_risk_score)"
              :status="getRiskStatus(row.ai_risk_score)"
            />
          </template>
        </el-table-column>

        <el-table-column label="风险标签" width="200">
          <template #default="{ row }">
            <el-tag v-for="label in row.ai_labels" :key="label" size="small" type="danger">
              {{ getLabelName(label) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="pass(row)">通过</el-button>
            <el-button type="danger" size="small" @click="reject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const aiConfig = ref({
  enabled: true,
  provider: 'simulated',
  autoPassThreshold: 20,
  autoRejectThreshold: 80
})

const stats = ref({
  aiCount: 156,
  autoPassCount: 120,
  manualCount: 36,
  accuracy: 94.5
})

const reviewList = ref([])

function getRiskColor(score) {
  if (score < 30) return '#67C23A'
  if (score < 70) return '#E6A23C'
  return '#F56C6C'
}

function getRiskStatus(score) {
  if (score < 30) return 'success'
  if (score < 70) return 'warning'
  return 'exception'
}

function getLabelName(label) {
  const map = {
    sensitive: '敏感内容',
    contact: '联系方式',
    ad: '广告宣传',
    politics: '政治敏感',
    violence: '暴力内容',
    porn: '色情低俗'
  }
  return map[label] || label
}
</script>
```

## 七、微信客服接入方案

### 方案一：接入微信客服插件（推荐）

在微信小程序或公众号中接入腾讯企点客服：

```javascript
// 微信客服接入
// 前提：已开通微信客服功能

// 微信客服消息推送配置
// 1. 在微信公众平台开通客服功能
// 2. 配置客服消息推送地址

// 后端接收客服消息
router.post('/api/wechat/callback', async (req, res) => {
  const { ToUserName, FromUserName, MsgType, Content } = req.body

  if (MsgType === 'text') {
    // 用户发送的消息
    const userMessage = Content

    // 记录消息
    await saveCustomerMessage({
      openid: FromUserName,
      content: userMessage,
      type: 'user'
    })

    // 如果是AI客服模式，自动回复
    if (isAiMode) {
      const reply = await aiChatbot(userMessage)
      await sendWechatMessage(FromUserName, reply)
    }
  }

  res.send('success')
})
```

### 方案二：使用腾讯云智绘AI客服

```javascript
// 使用腾讯云智绘AI客服
const { TencentAI } = require('tencentcloud-sdk-nodejs')

async function chatWithAI(userMessage, context) {
  const client = new TencentAI.tbp.Client({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY
    },
    region: 'ap-guangzhou'
  })

  const result = await client.TextProcess({
    Query: userMessage,
    SessionId: context.sessionId,
    BotName: '邻盟客服'
  })

  return {
    reply: result.Answer,
    sessionId: result.SessionId
  }
}
```

### 方案三：自建AI客服（使用开源LLM）

```javascript
// 使用开源LLM作为客服后端
const { ChatOpenAI } = require('langchain/chat_models')

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY, // 或使用其他兼容API
  model: 'gpt-3.5-turbo'
})

// 构建客服Prompt
const SYSTEM_PROMPT = `你是邻盟平台的智能客服助手。
邻盟是一个社区资源智能匹配平台，连接社区和商家。

常见问答：
- 如何发布需求？→ 在社区端首页点击「发布新需求」
- 如何联系商家？→ 在资源广场查看商家资源，点击「立即联系」提交意向
- 会员权益？→ 金牌会员可查看商家联系方式，享受优先推荐

请根据用户问题提供帮助。`

async function chatWithAI(userMessage) {
  const response = await chatModel.call([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ])

  return response.content
}
```

## 八、实施建议

### 第一阶段（1-2周）
- 部署模拟AI审核服务
- 完成前端管理界面
- 人工+AI混合审核模式

### 第二阶段（2-4周）
- 接入腾讯云/阿里云AI服务
- 优化审核准确率
- 收集反馈调整阈值

### 第三阶段（持续优化）
- 自建AI审核模型
- 引入知识图谱增强审核能力
- 完善客服知识库
