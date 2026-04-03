<template>
  <div class="page">
    <h2>个人中心</h2>

    <el-row :gutter="20" v-loading="loading" element-loading-text="加载中...">
      <!-- 左侧：社区基本信息 -->
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" :src="profile.logo" style="background:#1a56db">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </el-avatar>
            <div class="community-name">{{ profile.community_name }}</div>
            <div class="district-name">{{ profile.district }} · {{ profile.street }}</div>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ profile.demandCount || 0 }}</div><div class="stat-label">发布需求</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.intentionCount || 0 }}</div><div class="stat-label">撮合成功</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.merchant_count || 0 }}</div><div class="stat-label">社区商户</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑社区资料</el-button>
        </div>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :xs="24" :sm="24" :md="16">
        <el-card v-if="!editing">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">社区详细资料</span>
              <el-button text type="primary" @click="startEdit"><el-icon><Edit /></el-icon> 编辑</el-button>
            </div>
          </template>
          <el-tabs v-model="infoTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="社区名称">{{ profile.community_name }}</el-descriptions-item>
                <el-descriptions-item label="小区名称">{{ profile.community }}</el-descriptions-item>
                <el-descriptions-item label="所属行政区">{{ profile.district || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="所属街道">{{ profile.street || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系人职务">{{ profile.position || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系手机">{{ profile.username }}</el-descriptions-item>
                <el-descriptions-item label="详细地址" :span="2">{{ profile.address || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="profile.status === 1 ? 'success' : 'warning'" size="small">
                    {{ profile.status === 1 ? '已通过' : '待审核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="社区简介" :span="2">{{ profile.description || '暂无简介' }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="社区画像" name="portrait">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="小区总户数">{{ profile.households || '未填写' }}户</el-descriptions-item>
                <el-descriptions-item label="社区商户数">{{ profile.merchant_count || 0 }}家</el-descriptions-item>
                <el-descriptions-item label="亲子家庭占比">{{ profile.family_ratio ? profile.family_ratio + '%' : '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="老年群体占比">{{ profile.elderly_ratio ? profile.elderly_ratio + '%' : '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="公共空间面积">{{ profile.public_space_area ? profile.public_space_area + '㎡' : '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="户外广场">{{ profile.has_outdoor_plaza ? '有户外广场' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="商业体/商业街">{{ profile.has_commercial ? '有商业配套' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="学校/幼儿园">{{ profile.has_school ? '有学校/幼儿园' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="公园/体育场馆">{{ profile.has_park ? '有公园/体育设施' : '无' }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="我的标签" name="tags">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">标签越精准，智能匹配效果越好</p>
              <div class="tag-list">
                <el-tag v-for="tag in (Array.isArray(profile.tags) ? profile.tags : (profile.tags ? profile.tags.split(',') : []))" :key="tag" style="margin:4px">{{ tag }}</el-tag>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">管理标签</el-button>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 编辑表单 -->
        <el-card v-else>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">编辑社区资料</span>
              <el-button text @click="editing=false">取消</el-button>
            </div>
          </template>
          <el-form :model="editForm" label-width="140px" ref="formRef">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="社区名称">
                  <el-input v-model="editForm.community_name" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="小区名称">
                  <el-input v-model="editForm.community" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="所属行政区">
                  <el-input v-model="editForm.district" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="所属街道">
                  <el-input v-model="editForm.street" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系人职务">
                  <el-input v-model="editForm.position" placeholder="如：社区主任" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系手机">
                  <el-input v-model="editForm.username" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详细地址">
                  <el-input v-model="editForm.address" placeholder="详细地址（楼栋门牌号等）" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社区Logo">
                  <el-input v-model="editForm.logo" placeholder="输入Logo图片URL" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="场地图片">
                  <el-input v-model="editForm.imagesStr" placeholder="输入图片URL，多个用英文逗号分隔" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">社区画像数据</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="小区总户数">
                  <el-input-number v-model="editForm.households" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="社区商户数">
                  <el-input-number v-model="editForm.merchant_count" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="亲子家庭占比">
                  <el-input v-model="editForm.family_ratio" placeholder="如：35" />%
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="老年群体占比">
                  <el-input v-model="editForm.elderly_ratio" placeholder="如：28" />%
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="公共空间面积(㎡)">
                  <el-input-number v-model="editForm.public_space_area" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="户外广场">
                  <el-switch v-model="editForm.has_outdoor_plaza" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="商业体/商业街">
                  <el-switch v-model="editForm.has_commercial" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="学校/幼儿园">
                  <el-switch v-model="editForm.has_school" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="公园/体育场馆">
                  <el-switch v-model="editForm.has_park" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社区简介">
                  <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="简要介绍社区特色..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">社区标签</el-divider>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Edit } from '@element-plus/icons-vue'
import { getProfile, updateProfile } from '@/api/community'

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const infoTab = ref('basic')
const profile = ref({})

const allTags = ['亲子友好', '老年服务', '文化活动', '体育赛事', '教育资源', '健康社区', '公益活动', '科技创新', '环保绿色', '商业活跃', '居民参与度高', '节庆氛围浓']

const editForm = ref({
  community_name: '',
  community: '',
  district: '',
  street: '',
  position: '',
  username: '',
  address: '',
  logo: '',
  imagesStr: '',
  households: null,
  merchant_count: null,
  family_ratio: '',
  elderly_ratio: '',
  public_space_area: null,
  has_outdoor_plaza: 0,
  has_commercial: 0,
  has_school: 0,
  has_park: 0,
  description: '',
  tagsList: []
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await getProfile()
    profile.value = res.data || {}
  } catch {
    ElMessage.error('加载社区资料失败')
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
    community_name: profile.value.community_name || '',
    community: profile.value.community || '',
    district: profile.value.district || '',
    street: profile.value.street || '',
    position: profile.value.position || '',
    username: profile.value.username || '',
    address: profile.value.address || '',
    logo: profile.value.logo || '',
    imagesStr: imagesArray.join(','),
    households: profile.value.households || null,
    merchant_count: profile.value.merchant_count || null,
    family_ratio: profile.value.family_ratio || '',
    elderly_ratio: profile.value.elderly_ratio || '',
    public_space_area: profile.value.public_space_area || null,
    has_outdoor_plaza: profile.value.has_outdoor_plaza || 0,
    has_commercial: profile.value.has_commercial || 0,
    has_school: profile.value.has_school || 0,
    has_park: profile.value.has_park || 0,
    description: profile.value.description || '',
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
  saving.value = true
  try {
    const images = editForm.value.imagesStr
      ? editForm.value.imagesStr.split(',').map(s => s.trim()).filter(Boolean)
      : []
    await updateProfile({
      logo: editForm.value.logo,
      address: editForm.value.address,
      position: editForm.value.position,
      images,
      households: editForm.value.households,
      merchant_count: editForm.value.merchant_count,
      family_ratio: editForm.value.family_ratio,
      elderly_ratio: editForm.value.elderly_ratio,
      public_space_area: editForm.value.public_space_area,
      has_outdoor_plaza: editForm.value.has_outdoor_plaza,
      has_commercial: editForm.value.has_commercial,
      has_school: editForm.value.has_school,
      has_park: editForm.value.has_park,
      description: editForm.value.description,
      tags: editForm.value.tagsList
    })
    await loadProfile()
    editing.value = false
    ElMessage.success('社区资料已保存')
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
.community-name { font-size: 17px; font-weight: 700; margin-top: 10px; }
.district-name { font-size: 13px; color: #909399; margin-top: 4px; }
.stats-row { display: flex; justify-content: space-around; margin: 16px 0; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.stat-item { text-align: center; }
.stat-val { font-size: 22px; font-weight: 700; color: #1a56db; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.tag-list { display: flex; flex-wrap: wrap; }
.tag-selector { display: flex; flex-wrap: wrap; }

@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page h2 { font-size: 18px; margin-bottom: 14px; }
  .profile-card { padding: 16px; border-radius: 8px; }
  .avatar-area .el-avatar { width: 64px !important; height: 64px !important; }
  .community-name { font-size: 15px; }
  :deep(.el-descriptions) { font-size: 13px; }
  :deep(.el-descriptions__label) { width: 100px; font-size: 12px; }
}
</style>
