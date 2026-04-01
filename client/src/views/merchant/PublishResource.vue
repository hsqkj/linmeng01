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
            :class="{ active: form.type === t.value }"
            @click="form.type = t.value"
          >
            <div class="type-icon">{{ t.icon }}</div>
            <h4>{{ t.label }}</h4>
            <p>{{ t.desc }}</p>
            <div class="check-badge" v-if="form.type === t.value">✓ 已选</div>
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
        <template v-if="form.type === 'fund'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="可赞助最低金额（元）">
                <el-input-number v-model="form.fundMin" :min="0" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可赞助最高金额（元）" required>
                <el-input-number v-model="form.fundMax" :min="1000" style="width:100%" />
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

        <!-- 物资提供 -->
        <template v-if="form.type === 'goods'">
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
                <el-radio-group v-model="form.goodsDelivery">
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

        <!-- 人力支持 -->
        <template v-if="form.type === 'manpower'">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="可派遣人数" required>
                <el-input-number v-model="form.manpowerCount" :min="1" :max="200" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单次最长服务时长（小时）">
                <el-input-number v-model="form.manpowerMaxHours" :min="1" :step="0.5" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="人员类型描述" required>
            <el-input v-model="form.manpowerDesc" type="textarea" :rows="4" placeholder="如：5名专业活动策划人员（有500人以上活动执行经验）、3名主持人（普通话一甲）、10名志愿者（具备急救培训证书）" />
          </el-form-item>
        </template>

        <!-- 技术支持 -->
        <template v-if="form.type === 'tech'">
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
        <template v-if="form.type === 'professional'">
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
                <el-select v-model="form.serviceArea" placeholder="选择服务区域" style="width:100%">
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

        <!-- 媒体报道 -->
        <template v-if="form.type === 'media'">
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
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="全面介绍您的资源优势、使用方式、适合场景等，越详细越好！" maxlength="1000" show-word-limit />
        </el-form-item>

        <el-form-item label="资源标签">
          <div class="tag-selector">
            <el-check-tag v-for="tag in merchantTagOptions" :key="tag" :checked="form.tags.includes(tag)" @change="toggleTag(form.tags, tag)" class="selector-tag">{{ tag }}</el-check-tag>
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
            <el-checkbox label="kids">亲子社区（高亲子家庭占比）</el-checkbox>
            <el-checkbox label="elder">老龄化社区</el-checkbox>
            <el-checkbox label="young">青年社区</el-checkbox>
            <el-checkbox label="commercial">商业密集社区</el-checkbox>
            <el-checkbox label="school">学区社区</el-checkbox>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Check, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const activeStep = ref(0)
const submitting = ref(false)

const resourceTypes = [
  { value: 'fund', icon: '💵', label: '资金赞助', desc: '提供活动资金支持，金额可面议' },
  { value: 'goods', icon: '📦', label: '物资提供', desc: '提供实物物资，如饮品、礼品、物料等' },
  { value: 'manpower', icon: '👥', label: '人力支持', desc: '提供人员服务，如主持人、志愿者、专业团队' },
  { value: 'tech', icon: '💻', label: '技术支持', desc: '提供设备器材或技术服务，如音响、灯光、直播' },
  { value: 'professional', icon: '🎓', label: '专业服务', desc: '提供专业人士服务，如法律、医疗、教育等' },
  { value: 'media', icon: '📰', label: '媒体报道', desc: '提供媒体宣传资源，如公众号、抖音、新闻等' }
]

const professionalTypes = ['法律咨询', '医疗健康', '心理辅导', '教育培训', '金融理财', '技能培训', '营养指导', '体育健身', '文艺指导', '社会工作', '其他']
const merchantTagOptions = ['连锁品牌', '本地企业', '上市公司', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任']
const expectedRewardOptions = ['活动冠名权', '现场展台', '社区公众号宣传', '业主群推送', '荣誉证书', '现场横幅', '宣传栏展示', '主持人口播', '媒体报道', '感谢状']

const form = ref({
  type: '', title: '', description: '', tags: [], resourceImages: [],
  fundMin: 0, fundMax: 50000, fundScenes: [],
  goodsDetail: '', goodsExpiry: '', goodsDelivery: 'both', goodsImages: [],
  manpowerCount: 3, manpowerMaxHours: 8, manpowerDesc: '',
  techTypes: [], techDesc: '', techServiceType: 'both',
  professionalType: '', qualification: '', serviceArea: 'city', pricingType: 'free',
  mediaChannels: [], mediaDesc: '',
  expectedRewards: [], expectedRewardDesc: '', targetCommunityTypes: ['any'], validUntil: ''
})

const resourceTypeLabel = computed(() => {
  const t = resourceTypes.find(t => t.value === form.value.type)
  return t ? t.label : ''
})

const titlePlaceholder = computed(() => {
  const map = {
    fund: '如：星巴克咖啡支持活动资金5万元',
    goods: '如：礼品套装300份，免费赞助社区活动',
    manpower: '如：提供5人专业活动执行团队',
    tech: '如：专业音响灯光设备免费支持',
    professional: '如：法律专家免费为居民提供咨询',
    media: '如：公众号15万粉丝免费宣传推广'
  }
  return map[form.value.type] || '请填写资源标题'
})

function toggleTag(arr, val) {
  const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); else arr.push(val)
}
function removeTag(arr, val) {
  const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1)
}

function nextStep() {
  if (activeStep.value === 0 && !form.value.type) { ElMessage.warning('请先选择资源类型'); return }
  if (activeStep.value === 1 && !form.value.title) { ElMessage.warning('请填写资源标题'); return }
  activeStep.value++
}

async function submitResource() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 1500))
  submitting.value = false
  ElMessage.success('资源已提交审核！审核通过后将推送给匹配社区')
  setTimeout(() => router.push('/merchant/resources'), 1500)
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
