<template>
  <div class="publish-resource">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>发布商家资源</h2>
    </div>

    <el-steps :active="activeStep" finish-status="success" class="steps">
      <el-step title="选择类型" />
      <el-step title="填写信息" />
      <el-step title="设置期望回报" />
      <el-step title="提交审核" />
    </el-steps>

    <el-form :model="form" label-position="top" class="resource-form">

      <!-- 步骤1：选择资源类型 -->
      <div v-if="activeStep === 0" class="step-content">
        <h3>选择资源类型</h3>
        <p class="step-tip">💡 选择最符合您资源特点的类型，有助于精准匹配有需求的社区</p>
        <div class="type-cards">
          <div v-for="t in resourceTypes" :key="t.value"
            class="type-card"
            :class="{ active: form.resource_type === t.value }"
            @click="form.resource_type = t.value"
          >
            <div class="type-icon">{{ t.icon }}</div>
            <h4>{{ t.label }}</h4>
            <p>{{ t.desc }}</p>
            <div class="check-badge" v-if="form.resource_type === t.value">✓ 已选</div>
          </div>
        </div>
      </div>

      <!-- 步骤2：填写资源信息 -->
      <div v-if="activeStep === 1" class="step-content">
        <div class="form-tip-box">💡 填写越详细，社区匹配越精准！包括服务范围、数量、时间等具体信息</div>

        <el-form-item label="资源标题" required>
          <el-input v-model="form.title" :placeholder="titlePlaceholder" maxlength="50" show-word-limit />
          <div class="field-tip">📋 一句话概括您提供的资源，清晰直观</div>
        </el-form-item>

        <!-- 资金赞助 -->
        <template v-if="form.resource_type === '资金赞助'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="可赞助最低金额（元）">
                <el-input-number v-model="form.min_amount" :min="0" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可赞助最高金额（元）" required>
                <el-input-number v-model="form.max_amount" :min="1000" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="适用场景（可多选）">
            <el-checkbox-group v-model="form.fundScenes">
              <el-checkbox label="festival">节庆活动</el-checkbox>
              <el-checkbox label="welfare">公益活动</el-checkbox>
              <el-checkbox label="sports">体育赛事</el-checkbox>
              <el-checkbox label="education">教育活动</el-checkbox>
              <el-checkbox label="culture">文化活动</el-checkbox>
              <el-checkbox label="any">不限场景</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>

        <!-- 物资捐赠 -->
        <template v-if="form.resource_type === '物资捐赠'">
          <el-form-item label="物资清单" required>
            <el-input v-model="form.goodsDetail" type="textarea" :rows="5"
              placeholder="请详细列出可提供的物资，如：
- 矿泉水 500ml，可提供500瓶
- 礼品袋 可提供200个，规格：28×35cm
每种物资单独列出，包含数量和规格，便于社区快速判断" />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="有效期至（可选）">
                <el-date-picker v-model="form.goodsExpiry" type="date" placeholder="选择有效期" style="width:100%" format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="领取方式">
                <el-radio-group v-model="form.pickup_way">
                  <el-radio label="delivery">可配送</el-radio>
                  <el-radio label="pickup">自取</el-radio>
                  <el-radio label="both">均可</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="物资图片">
            <el-upload v-model:file-list="form.goodsImages" list-type="picture-card" :auto-upload="false" :limit="6" accept="image/*">
              <el-icon><Plus /></el-icon>
              <template #tip><div class="el-upload__tip">上传物资实物图片，让社区直观了解（最多6张）</div></template>
            </el-upload>
          </el-form-item>
        </template>

        <!-- 人力支持/志愿服务 -->
        <template v-if="form.resource_type === '志愿服务'">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="可派遣人数" required>
                <el-input-number v-model="form.staff_count" :min="1" :max="200" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单次最长服务时长（小时）">
                <el-input-number v-model="form.work_duration" :min="1" :step="0.5" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="人员类型描述" required>
            <el-input v-model="form.manpowerDesc" type="textarea" :rows="4" placeholder="如：5名专业活动策划人员（有500人以上活动执行经验）、3名主持人（普通话一甲）、10名志愿者（具备急救培训证书）" />
          </el-form-item>
        </template>

        <!-- 技术支持 -->
        <template v-if="form.resource_type === '技术支持'">
          <el-form-item label="技术类型（可多选）" required>
            <el-checkbox-group v-model="form.techTypes">
              <el-checkbox label="equipment">设备器材</el-checkbox>
              <el-checkbox label="software">软件系统</el-checkbox>
              <el-checkbox label="network">网络通信</el-checkbox>
              <el-checkbox label="av">专业音视频</el-checkbox>
              <el-checkbox label="lighting">灯光设备</el-checkbox>
              <el-checkbox label="smart">智能设备</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="技术服务描述" required>
            <el-input v-model="form.techDesc" type="textarea" :rows="4" placeholder="详细说明可提供的技术支持，如：专业音响系统（额定功率1000W，适合500人场地）、专业灯光设备（含舞台追光、氛围灯）、专业摄影摄像团队" />
          </el-form-item>
          <el-form-item label="服务方式">
            <el-radio-group v-model="form.techServiceType">
              <el-radio label="rent">设备租借</el-radio>
              <el-radio label="service">提供服务团队</el-radio>
              <el-radio label="both">均可</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 专业服务 -->
        <template v-if="form.resource_type === '专业服务'">
          <el-form-item label="服务类型" required>
            <el-select v-model="form.professionalType" placeholder="选择专业服务类型" style="width:100%">
              <el-option v-for="t in professionalTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="资质证明描述">
            <el-input v-model="form.qualification" type="textarea" :rows="3" placeholder="如：注册律师，执业20年，擅长劳动争议、物业纠纷；具备律师资格证（证号：xxx）" />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="服务区域">
                <el-select v-model="form.serviceScope" placeholder="选择服务区域" style="width:100%">
                  <el-option label="全市" value="city" />
                  <el-option label="本区" value="district" />
                  <el-option label="本街道" value="street" />
                  <el-option label="全国（线上）" value="nationwide" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收费标准">
                <el-select v-model="form.pricingType" style="width:100%">
                  <el-option label="免费（公益赞助）" value="free" />
                  <el-option label="优惠价（面议）" value="discount" />
                  <el-option label="市场价" value="market" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 媒体宣传 -->
        <template v-if="form.resource_type === '媒体宣传'">
          <el-form-item label="可提供媒体类型（可多选）" required>
            <el-checkbox-group v-model="form.mediaChannels">
              <el-checkbox label="news">新闻网站/APP</el-checkbox>
              <el-checkbox label="wechat">微信公众号</el-checkbox>
              <el-checkbox label="video">短视频（抖音/视频号）</el-checkbox>
              <el-checkbox label="tv">电视/广播</el-checkbox>
              <el-checkbox label="paper">报纸</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="媒体资源描述" required>
            <el-input v-model="form.mediaDesc" type="textarea" :rows="4" placeholder="详细说明您的媒体资源，如：
- 微信公众号：粉丝15万，单篇阅读量5000+
- 抖音号：粉丝8万，视频平均播放量2万+
- 地方新闻网站：日活用户50万
覆盖范围越详细，社区选择意愿越高！" />
          </el-form-item>
        </template>

        <!-- 通用字段 -->
        <el-divider />
        <el-form-item label="详细介绍" required>
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="全面介绍您的资源优势、使用方式、适合场景等，越详细越好！" maxlength="1000" show-word-limit />
        </el-form-item>

        <el-form-item label="资源标签">
          <div class="tag-selector">
            <el-check-tag v-for="tag in merchantTagOptions" :key="tag" :checked="form.tags.includes(tag)" @change="toggleTag(form.tags, tag)" class="selector-tag">{{ tag }}</el-check-tag>
          </div>
          <div class="custom-tag-input">
            <el-input v-model="customTag" placeholder="输入自定义标签后按回车添加" size="small" style="width:220px" @keydown.enter.prevent="addCustomTag">
              <template #append>
                <el-button @click="addCustomTag" :disabled="!customTag.trim()">添加</el-button>
              </template>
            </el-input>
            <span class="tag-hint">最多添加10个标签</span>
          </div>
          <div class="selected-tags" v-if="form.tags.length > 0">
            已选：<el-tag v-for="t in form.tags" :key="t" size="small" closable @close="removeTag(form.tags, t)">{{ t }}</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="资源图片/案例展示">
          <el-upload v-model:file-list="form.resourceImages" list-type="picture-card" :auto-upload="false" :limit="6" accept="image/*">
            <el-icon><Plus /></el-icon>
            <template #tip><div class="el-upload__tip">上传资源图片或成功案例图片（最多6张）</div></template>
          </el-upload>
        </el-form-item>
      </div>

      <!-- 步骤3：期望回报 -->
      <div v-if="activeStep === 2" class="step-content">
        <div class="form-tip-box">💡 明确期望回报有助于社区快速决定是否合作，提高对接成功率！</div>
        <h3>您期望获得的回报</h3>

        <el-form-item label="期望回报类型（多选）">
          <div class="tag-selector">
            <el-check-tag v-for="r in expectedRewardOptions" :key="r" :checked="form.expectedRewards.includes(r)" @change="toggleTag(form.expectedRewards, r)" class="selector-tag">{{ r }}</el-check-tag>
          </div>
        </el-form-item>

        <el-form-item label="期望回报说明">
          <el-input v-model="form.expectedRewardDesc" type="textarea" :rows="4" placeholder="如：希望获得社区公众号推文宣传1篇，以及现场展台一处（约10平米）。尽量量化期望，便于双方达成共识！" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item label="期望合作的社区类型（可多选）">
          <el-checkbox-group v-model="form.targetCommunityTypes">
            <el-checkbox v-for="ct in communityTypeOptions" :key="ct" :label="ct">{{ ct }}</el-checkbox>
            <el-checkbox label="any">不限</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="有效期至">
          <el-date-picker v-model="form.validUntil" type="date" placeholder="资源有效期截止日期" style="width:100%" format="YYYY-MM-DD" />
          <div class="field-tip">📅 设置有效期可以让社区了解资源的紧迫性</div>
        </el-form-item>
      </div>

      <!-- 步骤4：提交 -->
      <div v-if="activeStep === 3" class="step-content">
        <el-result icon="success" title="资源信息填写完成！" sub-title="提交后将进入审核队列（通常4小时内完成）">
          <template #extra>
            <div class="preview-card">
              <div class="preview-item"><span class="label">资源类型：</span>{{ resourceTypeLabel }}</div>
              <div class="preview-item"><span class="label">资源标题：</span>{{ form.title }}</div>
              <div class="preview-item" v-if="form.tags.length > 0">
                <span class="label">标签：</span>
                <el-tag v-for="t in form.tags" :key="t" size="small" style="margin:2px">{{ t }}</el-tag>
              </div>
            </div>
            <div class="tip-box"><el-icon color="#E6A23C"><Warning /></el-icon>审核通过后资源将自动推送给匹配的社区工作者</div>
          </template>
        </el-result>
      </div>
    </el-form>

    <div class="step-actions">
      <el-button v-if="activeStep > 0" @click="activeStep--" size="large">上一步</el-button>
      <el-button v-if="activeStep < 3" type="primary" @click="nextStep" size="large">
        {{ activeStep === 2 ? '预览确认' : '下一步' }}
      </el-button>
      <el-button v-if="activeStep === 3" type="success" @click="submitResource" :loading="submitting" size="large">
        <el-icon><Check /></el-icon> 提交审核
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Check, Warning } from '@element-plus/icons-vue'
import { createResource } from '@/api/merchant'
import { uploadImage } from '@/api/public'

const router = useRouter()
const activeStep = ref(0)
const submitting = ref(false)
const customTag = ref('')

// 发布类型配置 - 从后端API加载
const resourceTypes = ref([
  { value: '专业服务', icon: '🎓', label: '专业服务', desc: '咨询、法律、设计等专业服务' },
  { value: '教育培训', icon: '📚', label: '教育培训', desc: '课程、培训、讲座等服务' },
  { value: '场地资源', icon: '🏠', label: '场地资源', desc: '活动室、运动场地等场所支持' },
  { value: '物资捐赠', icon: '📦', label: '物资捐赠', desc: '图书、设备、食品等物资' },
  { value: '志愿服务', icon: '👥', label: '志愿服务', desc: '人力支持、活动协助等' },
  { value: '资金赞助', icon: '💵', label: '资金赞助', desc: '活动经费、奖金等资金支持' },
  { value: '技术支持', icon: '💻', label: '技术支持', desc: 'IT、网络、设备维护等技术支持' },
  { value: '健康医疗', icon: '🏥', label: '健康医疗', desc: '义诊、健康讲座等服务' },
  { value: '活动赞助', icon: '🎉', label: '活动赞助', desc: '活动策划、物料等赞助' },
  { value: '媒体宣传', icon: '📰', label: '媒体宣传', desc: '公众号、媒体推广等服务' },
  { value: '技能培训', icon: '🛠️', label: '技能培训', desc: '技能传授、指导等服务' },
  { value: '养老服务', icon: '👴', label: '养老服务', desc: '助老服务、健康管理等' }
])

const professionalTypes = ref(['法律咨询', '医疗健康', '心理辅导', '教育培训', '金融理财', '技能培训', '营养指导', '体育健身', '文艺指导', '社会工作', '其他'])
const merchantTagOptions = ref(['连锁品牌', '本地企业', '上市公司', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任'])
const communityTypeOptions = ref([])
const expectedRewardOptions = ref(['活动冠名权', '现场展台', '社区公众号宣传', '业主群推送', '荣誉证书', '现场横幅', '宣传栏展示', '主持人口播', '媒体报道', '感谢状'])

async function loadPublishTypes() {
  try {
    const { getPublishTypes } = await import('@/api/merchant')
    const res = await getPublishTypes()
    const data = res.data || {}
    if (data.merchant_tags) merchantTagOptions.value = data.merchant_tags
    // 加载资源类型配置
    if (data.resource_types && data.resource_types.length > 0) {
      const typeConfig = {
        '专业服务': { icon: '🎓', desc: '咨询、法律、设计等专业服务' },
        '教育培训': { icon: '📚', desc: '课程、培训、讲座等服务' },
        '场地资源': { icon: '🏠', desc: '活动室、运动场地等场所支持' },
        '物资捐赠': { icon: '📦', desc: '图书、设备、食品等物资' },
        '志愿服务': { icon: '👥', desc: '人力支持、活动协助等' },
        '资金赞助': { icon: '💵', desc: '活动经费、奖金等资金支持' },
        '技术支持': { icon: '💻', desc: 'IT、网络、设备维护等技术支持' },
        '健康医疗': { icon: '🏥', desc: '义诊、健康讲座等服务' },
        '活动赞助': { icon: '🎉', desc: '活动策划、物料等赞助' },
        '媒体宣传': { icon: '📰', desc: '公众号、媒体推广等服务' },
        '技能培训': { icon: '🛠️', desc: '技能传授、指导等服务' },
        '养老服务': { icon: '👴', desc: '助老服务、健康管理等' }
      }
      resourceTypes.value = data.resource_types.map(name => ({
        value: name,
        label: name,
        icon: typeConfig[name]?.icon || '📋',
        desc: typeConfig[name]?.desc || ''
      }))
    }
    // 加载社区类型配置
    if (data.community_types && data.community_types.length > 0) {
      communityTypeOptions.value = data.community_types
    }
  } catch {
    // 使用默认值
  }
}

onMounted(() => {
  loadPublishTypes()
})

const form = ref({
  resource_type: '', title: '', content: '', tags: [], resourceImages: [],
  min_amount: 0, max_amount: 50000, fundScenes: [],
  goodsDetail: '', goodsExpiry: '', pickup_way: 'both', goodsImages: [],
  staff_count: 3, work_duration: 8, manpowerDesc: '',
  techTypes: [], techDesc: '', techServiceType: 'both',
  professionalType: '', qualification: '', serviceScope: 'city', pricingType: 'free',
  mediaChannels: [], mediaDesc: '',
  expectedRewards: [], expectedRewardDesc: '', targetCommunityTypes: ['any'], validUntil: ''
})

const resourceTypeLabel = computed(() => {
  return form.value.resource_type || ''
})

const titlePlaceholder = computed(() => {
  const map = {
    '资金赞助': '如：星巴克咖啡支持活动资金5万元',
    '物资捐赠': '如：礼品套装300份，免费赞助社区活动',
    '志愿服务': '如：提供5人专业活动执行团队',
    '技术支持': '如：专业音响灯光设备免费支持',
    '专业服务': '如：法律专家免费为居民提供咨询',
    '媒体宣传': '如：公众号15万粉丝免费宣传推广',
    '教育培训': '如：专业讲师团队提供免费培训课程',
    '场地资源': '如：社区活动中心免费借用',
    '健康医疗': '如：专业医生团队提供义诊服务',
    '活动赞助': '如：活动策划及物料赞助支持',
    '技能培训': '如：专业技能培训课程免费教授',
    '养老服务': '如：助老服务、健康管理等支持'
  }
  return map[form.value.resource_type] || '请填写资源标题'
})

function toggleTag(arr, val) {
  const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); else arr.push(val)
}
function removeTag(arr, val) {
  const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1)
}

function addCustomTag() {
  const tag = customTag.value.trim()
  if (!tag) return
  if (form.value.tags.includes(tag)) {
    ElMessage.warning('该标签已添加')
    return
  }
  if (form.value.tags.length >= 10) {
    ElMessage.warning('最多添加10个标签')
    return
  }
  if (tag.length > 10) {
    ElMessage.warning('标签字数不能超过10个')
    return
  }
  form.value.tags.push(tag)
  customTag.value = ''
}

function nextStep() {
  if (activeStep.value === 0 && !form.value.resource_type) { ElMessage.warning('请先选择资源类型'); return }
  if (activeStep.value === 1 && !form.value.title) { ElMessage.warning('请填写资源标题'); return }
  activeStep.value++
}

async function submitResource() {
  submitting.value = true
  try {
    // 处理图片：先上传本地图片（blob:），再提取服务器URL
    const uploadedImages = []
    for (const img of (form.value.resourceImages || [])) {
      if (!img) continue
      if (img.url && img.url.startsWith('blob:') && img.raw) {
        // 本地文件，需要上传
        const res = await uploadImage(img.raw)
        if (res.data && res.data.url) {
          // 直接使用相对路径，服务器和本地都能正常工作
          uploadedImages.push(res.data.url)
        }
      } else if (img.url && !img.url.startsWith('blob:')) {
        // 已上传的图片，直接用（可能是相对路径或完整URL）
        let url = img.url
        // 如果是完整的 localhost URL，转换为相对路径
        if (url.includes('localhost:3000')) {
          url = url.substring(url.indexOf('/uploads'))
        }
        uploadedImages.push(url)
      }
    }

    const data = {
      resource_type: form.value.resource_type,
      title: form.value.title,
      // 内容：合并所有类型的内容描述
      content: form.value.content || form.value.manpowerDesc || form.value.goodsDetail || form.value.techDesc || form.value.mediaDesc || '',
      tags: form.value.tags,
      images: uploadedImages,
      // 资金赞助
      min_amount: form.value.min_amount || 0,
      max_amount: form.value.max_amount || 0,
      fund_scenes: form.value.fundScenes || [], // 适用场景
      // 物资捐赠
      quantity: form.value.quantity || 0,
      specs: form.value.goodsDetail || '', // 物资清单
      pickup_way: form.value.pickup_way || '',
      goods_expiry: form.value.goodsExpiry || null, // 有效期
      // 人力支持
      staff_count: form.value.staff_count || 0,
      work_duration: form.value.work_duration || 0,
      // 技术支持
      tech_types: form.value.techTypes || [],
      tech_service_type: form.value.techServiceType || '',
      // 专业服务
      professional_type: form.value.professionalType || '',
      service_scope: form.value.serviceScope || '',
      certification: form.value.qualification || '',
      price_range: form.value.pricingType || '',
      // 媒体报道
      media_type: '',
      coverage: '',
      media_channels: form.value.mediaChannels || [],
      // 其他
      valid_until: form.value.validUntil || null,
      expected_rewards: form.value.expectedRewards || [],
      expected_reward_desc: form.value.expectedRewardDesc || ''
    }
    await createResource(data)
    ElMessage.success('资源已提交审核！审核通过后将推送给匹配社区')
    setTimeout(() => router.push('/merchant/resources'), 1500)
  } catch (err) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-resource { max-width: 800px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-header h2 { flex: 1; margin: 0; font-size: 22px; font-weight: 700; }
.steps { margin-bottom: 32px; }
.step-content { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.form-tip-box { background: linear-gradient(135deg, #e8f4ff, #fff8e1); border: 1px solid #b3d4ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; color: #409EFF; font-size: 14px; }
.step-tip { color: #909399; font-size: 14px; margin-bottom: 16px; }
h3 { font-size: 18px; margin-bottom: 20px; color: #303133; }
.type-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.type-card { border: 2px solid #eee; border-radius: 12px; padding: 20px 16px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
.type-card:hover { border-color: #67C23A; background: #f0fff4; transform: translateY(-2px); }
.type-card.active { border-color: #67C23A; background: #e8f8ed; box-shadow: 0 0 0 3px rgba(103,194,58,0.15); }
.type-icon { font-size: 36px; margin-bottom: 8px; }
.type-card h4 { font-size: 15px; margin: 0 0 6px; }
.type-card p { font-size: 12px; color: #909399; }
.check-badge { position: absolute; top: 8px; right: 8px; background: #67C23A; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.field-tip { margin-top: 4px; font-size: 12px; color: #909399; }
.tag-selector { display: flex; flex-wrap: wrap; gap: 8px; }
.selector-tag { cursor: pointer; }
.custom-tag-input { margin-top: 12px; display: flex; align-items: center; gap: 12px; }
.tag-hint { color: #909399; font-size: 12px; }
.selected-tags { margin-top: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.preview-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: left; min-width: 400px; margin-bottom: 16px; }
.preview-item { margin-bottom: 10px; font-size: 14px; }
.preview-item .label { color: #909399; margin-right: 8px; }
.tip-box { color: #E6A23C; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.step-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; padding-bottom: 40px; }

@media (max-width: 768px) {
  .type-cards { grid-template-columns: 1fr 1fr; }
  .preview-card { min-width: auto; width: 100%; }
}
</style>
