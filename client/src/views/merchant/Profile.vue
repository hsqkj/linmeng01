<template>
  <div class="page">
    <h2>商家中心</h2>

    <el-row :gutter="20" v-loading="loading" element-loading-text="加载中...">
      <!-- 左侧商家信息卡 -->
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" :src="profile.logo">
              <el-icon :size="40"><Shop /></el-icon>
            </el-avatar>
            <div class="merchant-name">{{ profile.company_name }}</div>
            <div class="merchant-type">{{ profile.industry || '未填写' }}</div>
            <el-tag type="warning" style="margin-top:8px">{{ memberLevelName[profile.member_level] || '普通会员' }}</el-tag>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ stats.resourceCount }}</div><div class="stat-label">发布资源</div></div>
            <div class="stat-item"><div class="stat-val">{{ stats.matchings }}</div><div class="stat-label">撮合成功</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.view_count || 0 }}</div><div class="stat-label">总浏览</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑商家资料</el-button>
        </div>
      </el-col>

      <!-- 右侧详细信息 -->
      <el-col :xs="24" :sm="24" :md="16">
        <el-card v-if="!editing">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">商家详细资料</span>
              <el-button text type="primary" @click="startEdit"><el-icon><Edit /></el-icon> 编辑</el-button>
            </div>
          </template>
          <el-tabs v-model="infoTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="企业名称">{{ profile.company_name }}</el-descriptions-item>
                <el-descriptions-item label="行业分类">{{ profile.industry || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="企业规模">{{ profile.scale || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ profile.contact_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ profile.phone }}</el-descriptions-item>
                <el-descriptions-item label="企业地址" :span="2">{{ profile.address || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="Logo">
                  <el-avatar :size="40" :src="profile.logo" />
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="profile.status === 1 ? 'success' : 'warning'" size="small">
                    {{ profile.status === 1 ? '已通过' : '待审核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="企业简介" :span="2">{{ profile.description || '暂无简介' }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="图文介绍" name="gallery">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">可上传商品图文介绍、成功案例等，让社区更了解您的品牌</p>
              <el-empty v-if="!galleryList.length" description="暂无图文介绍" :image-size="60" />
              <div v-else class="gallery-grid">
                <div v-for="(img, idx) in galleryList" :key="idx" class="gallery-item">
                  <el-image :src="img" fit="cover" style="width:100%;height:120px;border-radius:6px" />
                  <div class="gallery-label">{{ idx + 1 }}</div>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">添加/编辑图文</el-button>
            </el-tab-pane>

            <el-tab-pane label="我的标签" name="tags">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">选择与您的业务相关的标签，帮助社区更精准匹配</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <el-tag v-for="tag in (profile.tags ? profile.tags.split(',') : [])" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
                <span v-if="!profile.tags" style="color:#909399;font-size:13px">暂无标签</span>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">编辑标签</el-button>
            </el-tab-pane>

            <el-tab-pane label="会员权益" name="member">
              <div class="member-info" v-if="profile.member_level > 0">
                <div class="member-header">
                  <el-tag type="warning" size="large">{{ memberLevelName[profile.member_level] || '普通会员' }}</el-tag>
                  <span style="color:#909399;font-size:13px;margin-left:8px">有效期至：{{ profile.member_expire_at || '长期' }}</span>
                </div>
                <div class="benefit-grid">
                  <div class="benefit-item" v-for="b in memberBenefits" :key="b.title">
                    <div class="benefit-icon">{{ b.icon }}</div>
                    <div class="benefit-text">{{ b.title }}</div>
                  </div>
                </div>
                <el-button type="primary" style="margin-top:16px" @click="$router.push('/merchant/member')">升级会员</el-button>
              </div>
              <div v-else>
                <el-empty description="您当前是普通会员，升级后可享受更多权益" :image-size="60">
                  <el-button type="primary" @click="$router.push('/merchant/member')">立即升级</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 编辑表单 -->
        <el-card v-else>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">编辑商家资料</span>
              <el-button text @click="editing=false">取消</el-button>
            </div>
          </template>
          <el-form :model="editForm" label-width="130px">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="企业名称" required>
                  <el-input v-model="editForm.company_name" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="行业分类">
                  <el-select v-model="editForm.industry" placeholder="请选择行业分类" style="width:100%" clearable>
                    <el-option v-for="t in industryTypes" :key="t" :label="t" :value="t" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="企业规模">
                  <el-input v-model="editForm.scale" placeholder="如：50~200人" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系人">
                  <el-input v-model="editForm.contact_name" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系电话" required>
                  <el-input v-model="editForm.phone" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="企业地址">
                  <el-input v-model="editForm.address" placeholder="详细地址" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="企业Logo">
                  <el-input v-model="editForm.logo" placeholder="输入Logo图片URL" />
                  <div v-if="editForm.logo" style="margin-top:8px">
                    <el-avatar :size="48" :src="editForm.logo" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="图文介绍">
                  <el-input v-model="editForm.imagesStr" type="textarea" :rows="2" placeholder="输入图片URL，多个用英文逗号分隔" />
                  <div v-if="editForm.imagesList && editForm.imagesList.length" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                    <el-image v-for="(img,idx) in editForm.imagesList" :key="idx" :src="img" fit="cover" style="width:60px;height:60px;border-radius:6px" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="企业简介">
                  <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="简要介绍企业主营业务、优势等..." />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社会身份">
                  <el-input v-model="editForm.social_identity" type="textarea" :rows="2" placeholder="如：XX协会会员、XX机构合作方等" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="荣誉资质">
                  <el-input v-model="editForm.honors" type="textarea" :rows="2" placeholder="如：2024年度最具社会责任感企业、XX行业标杆等" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="专家介绍">
                  <el-input v-model="editForm.expert_intro" type="textarea" :rows="2" placeholder="介绍专家团队的专业背景、擅长领域、代表案例等" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">我的标签</el-divider>
            <el-form-item label="选择标签">
              <div class="tag-selector">
                <el-check-tag
                  v-for="tag in allTags" :key="tag"
                  :checked="editForm.tagsList.includes(tag)"
                  @change="toggleTag(tag)" style="margin:4px"
                >{{ tag }}</el-check-tag>
              </div>
            </el-form-item>

            <div style="text-align:right;margin-top:16px">
              <el-button @click="editing=false">取消</el-button>
              <el-button type="primary" @click="saveProfile" :loading="saving">保存资料</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Shop, Edit } from '@element-plus/icons-vue'
import { getProfile, updateProfile, getMyResources } from '@/api/merchant'

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const infoTab = ref('basic')
const profile = ref({})
const stats = ref({ resourceCount: 0, matchings: 0 })

const memberLevelName = { 0: '普通会员', 1: '普通会员', 2: '银牌会员', 3: '金牌会员', 4: '铂金会员', 5: '钻石会员' }

const industryTypes = [
  '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果', '美业', '保健养生', '体育健身', '银行保险', '电信服务',
  '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材', '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
  '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰', '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
  '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体', '自媒体', 'IT互联网', '软件开发', '图文广告',
  '电子电器维修', '家居维修', '美发', '建筑工程', '其他'
]

const allTags = ['亲子活动', '老年服务', '文化活动', '体育赛事', '教育培训', '健康医疗', '科技科普', '节庆活动', '环保公益', '商业推广', '社区建设', '志愿服务']

const memberBenefits = [
  { icon: '🔍', title: '查看联系方式' },
  { icon: '📊', title: '优先推荐' },
  { icon: '💬', title: '无限留言' },
  { icon: '🎁', title: '撮合奖励' }
]

const galleryList = computed(() => {
  if (!profile.value.images) return []
  return profile.value.images.split(',').filter(Boolean)
})

const editForm = ref({
  company_name: '',
  industry: '',
  scale: '',
  contact_name: '',
  phone: '',
  address: '',
  logo: '',
  imagesStr: '',
  imagesList: [],
  description: '',
  social_identity: '',
  honors: '',
  expert_intro: '',
  tagsList: []
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await getProfile()
    profile.value = res.data || {}
    // 同时加载资源数量
    try {
      const r = await getMyResources({ page: 1, pageSize: 1 })
      stats.value.resourceCount = r.data?.total || 0
    } catch {}
  } catch {
    ElMessage.error('加载商家资料失败')
  } finally {
    loading.value = false
  }
}

function startEdit() {
  const tags = profile.value.tags
  const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',') : [])
  const images = profile.value.images
  const imagesArray = Array.isArray(images) ? images : (images ? images.split(',').filter(Boolean) : [])
  editForm.value = {
    company_name: profile.value.company_name || '',
    industry: profile.value.industry || '',
    scale: profile.value.scale || '',
    contact_name: profile.value.contact_name || '',
    phone: profile.value.phone || '',
    address: profile.value.address || '',
    logo: profile.value.logo || '',
    imagesStr: imagesArray.join(','),
    imagesList: imagesArray,
    description: profile.value.description || '',
    social_identity: profile.value.social_identity || '',
    honors: profile.value.honors || '',
    expert_intro: profile.value.expert_intro || '',
    tagsList: tagsArray
  }
  editing.value = true
  infoTab.value = 'basic'
}

function toggleTag(tag) {
  const idx = editForm.value.tagsList.indexOf(tag)
  if (idx >= 0) editForm.value.tagsList.splice(idx, 1)
  else editForm.value.tagsList.push(tag)
}

async function saveProfile() {
  if (!editForm.value.phone) {
    ElMessage.warning('联系电话不能为空')
    return
  }
  saving.value = true
  try {
    const data = {
      company_name: editForm.value.company_name,
      industry: editForm.value.industry,
      company_type: editForm.value.scale,
      contact_name: editForm.value.contact_name,
      phone: editForm.value.phone,
      address: editForm.value.address,
      logo: editForm.value.logo,
      images: editForm.value.imagesStr.split(',').map(s => s.trim()).filter(Boolean).join(','),
      description: editForm.value.description,
      social_identity: editForm.value.social_identity,
      honors: editForm.value.honors,
      expert_intro: editForm.value.expert_intro,
      tags: editForm.value.tagsList.join(',')
    }
    await updateProfile(data)
    profile.value = { ...profile.value, ...data }
    editing.value = false
    ElMessage.success('商家资料已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.profile-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.avatar-area { margin-bottom: 16px; }
.merchant-name { font-size: 17px; font-weight: 700; margin-top: 10px; }
.merchant-type { font-size: 13px; color: #909399; margin-top: 4px; }
.stats-row { display: flex; justify-content: space-around; margin: 16px 0; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.stat-item { text-align: center; }
.stat-val { font-size: 22px; font-weight: 700; color: #67C23A; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.gallery-item { text-align: center; }
.gallery-label { font-size: 13px; color: #606266; margin-top: 6px; }
.tag-selector { display: flex; flex-wrap: wrap; }
.member-info { padding: 8px 0; }
.member-header { display: flex; align-items: center; margin-bottom: 16px; }
.benefit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
.benefit-item { background: #f5f7fa; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px; }
.benefit-icon { font-size: 20px; }
.benefit-text { font-size: 13px; font-weight: 500; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page h2 { font-size: 18px; margin-bottom: 14px; }
  .profile-card { padding: 16px; border-radius: 8px; }
  .avatar-area .el-avatar { width: 64px !important; height: 64px !important; }
  .merchant-name { font-size: 15px; }
  :deep(.el-descriptions) { font-size: 13px; }
  :deep(.el-descriptions__label) { width: 100px; font-size: 12px; }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
  .benefit-grid { grid-template-columns: 1fr; }
}
</style>
