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
            <div class="stat-item"><div class="stat-val">{{ profile.viewCount || 0 }}</div><div class="stat-label">浏览量</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑社区资料</el-button>
          <div class="quick-links">
            <div class="quick-link-item" @click="infoTab = 'favorites'">
              <el-icon><Star /></el-icon>
              <span>我的收藏</span>
            </div>
            <div class="quick-link-item" @click="infoTab = 'rewards'">
              <span>🎁</span>
              <span>我的奖励</span>
            </div>
          </div>
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
                <el-descriptions-item label="联系人姓名">{{ profile.contact_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系手机">{{ profile.username }}</el-descriptions-item>
                <el-descriptions-item label="详细地址" :span="2">{{ profile.address || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="地图定位" :span="2">
                  <template v-if="profile.latitude && profile.longitude">
                    <el-link :href="'https://maps.google.com/?q=' + profile.latitude + ',' + profile.longitude" target="_blank" type="primary">
                      📍 查看地图（{{ profile.latitude }}, {{ profile.longitude }}）
                    </el-link>
                  </template>
                  <span v-else>未设置定位</span>
                </el-descriptions-item>
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
            <el-tab-pane label="我的收藏" name="favorites">
              <div class="favorites-list" v-loading="favLoading">
                <el-empty v-if="!favLoading && favorites.length === 0" description="暂无收藏资源" :image-size="80" />
                <el-card v-for="item in favorites" :key="item.id" shadow="hover" class="fav-card" @click="viewFavResource(item)">
                  <div class="fav-header">
                    <el-avatar :size="40" :src="item.merchant_logo" @error="() => true">
                      <el-icon :size="18"><Shop /></el-icon>
                    </el-avatar>
                    <div class="fav-info">
                      <div class="fav-title">{{ item.resource_title || item.title }}</div>
                      <div class="fav-meta">
                        <el-tag size="small" type="info">{{ item.resource_type }}</el-tag>
                        <span class="fav-merchant">{{ item.company_name }}</span>
                      </div>
                    </div>
                    <el-icon class="fav-star active"><Star /></el-icon>
                  </div>
                  <p class="fav-desc">{{ item.resource_content || item.content }}</p>
                </el-card>
              </div>
            </el-tab-pane>
            <el-tab-pane label="我的奖励" name="rewards">
              <div class="rewards-section" v-loading="rewardLoading">
                <!-- 奖励统计 -->
                <div class="reward-stats">
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#67C23A">{{ rewardStats.totalCount }}</div>
                    <div class="reward-stat-label">累计奖励</div>
                  </div>
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#409EFF">{{ rewardStats.pendingCount }}</div>
                    <div class="reward-stat-label">待领取</div>
                  </div>
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#67C23A">{{ rewardStats.claimedCount }}</div>
                    <div class="reward-stat-label">已领取</div>
                  </div>
                </div>
                <!-- 奖励记录 -->
                <el-empty v-if="!rewardLoading && rewards.length === 0" description="暂无奖励记录" :image-size="80" />
                <div class="rewards-list">
                  <el-card v-for="item in rewards" :key="item.id" class="reward-card" shadow="hover">
                    <div class="reward-header">
                      <el-tag :type="rewardStatusType[item.status]" size="small">{{ rewardStatusName[item.status] }}</el-tag>
                      <span class="reward-time">{{ formatRewardTime(item.created_at || item.create_time) }}</span>
                    </div>
                    <div class="reward-body">
                      <span class="reward-icon">🎁</span>
                      <div class="reward-info">
                        <div class="reward-title">撮合成功奖励</div>
                        <div class="reward-desc">{{ item.reward_content || '撮合成功物资奖励' }}</div>
                        <div class="reward-meta" v-if="item.demand_title || item.resource_title">
                          <span v-if="item.demand_title">关联需求：{{ item.demand_title }}</span>
                          <span v-if="item.resource_title">关联资源：{{ item.resource_title }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="reward-footer" v-if="item.status === 1">
                      <el-button type="success" size="small" @click="handleClaimReward(item)">确认领取</el-button>
                    </div>
                  </el-card>
                </div>
                <!-- 分页 -->
                <div class="pagination" v-if="rewardTotal > rewardPageSize">
                  <el-pagination layout="prev,pager,next,total" :total="rewardTotal" :page-size="rewardPageSize" :current-page="rewardPage" @current-change="onRewardPageChange" />
                </div>
              </div>
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
                <el-form-item label="所属区">
                  <el-input v-model="editForm.district" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="所属街道">
                  <el-input v-model="editForm.street" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="社区名称">
                  <el-input v-model="editForm.community_name" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系手机">
                  <el-input v-model="editForm.username" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系人姓名">
                  <el-input v-model="editForm.contact_name" placeholder="请输入联系人姓名" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系人职务">
                  <el-input v-model="editForm.position" placeholder="如：社区主任" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="地图定位">
                  <div class="map-location-input">
                    <el-input v-model="editForm.latitude" placeholder="纬度 如：30.5728" style="width:160px;margin-right:8px" />
                    <el-input v-model="editForm.longitude" placeholder="经度 如：114.2553" style="width:160px;margin-right:8px" />
                    <el-link v-if="editForm.latitude && editForm.longitude" :href="'https://maps.google.com/?q=' + editForm.latitude + ',' + editForm.longitude" target="_blank" type="primary">📍 预览地图</el-link>
                    <span v-else style="color:#909399;font-size:12px">填写经纬度可精确定位社区位置</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详细地址">
                  <el-input v-model="editForm.address" placeholder="详细地址（楼栋门牌号等）" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社区Logo">
                  <div class="upload-item">
                    <el-upload
                      class="logo-uploader"
                      :show-file-list="false"
                      :before-upload="beforeLogoUpload"
                      :http-request="uploadLogo"
                    >
                      <img v-if="editForm.logo" :src="editForm.logo" class="uploaded-logo" />
                      <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                    <span class="upload-tip">点击上传Logo图片（建议200x200）</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="场地图片">
                  <el-upload
                    v-model:file-list="editForm.logoImagesList"
                    list-type="picture-card"
                    :auto-upload="false"
                    :limit="9"
                    accept="image/*"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                  <div class="upload-tip">上传场地照片，最多9张</div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">社区画像数据</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="小区名称">
                  <el-input v-model="editForm.community" placeholder="请输入小区名称" />
                </el-form-item>
              </el-col>
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
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Edit, Shop, Star, Plus } from '@element-plus/icons-vue'
import { getProfile, updateProfile, getMyFavorites, getRewards, claimReward } from '@/api/community'
import { uploadImage } from '@/api/public'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const infoTab = ref('basic')
const profile = ref({})
const favorites = ref([])
const favLoading = ref(false)

// 奖励相关
const rewardLoading = ref(false)
const rewards = ref([])
const rewardTotal = ref(0)
const rewardPage = ref(1)
const rewardPageSize = 10
const rewardStatusName = { 0: '待发放', 1: '待领取', 2: '已领取', 3: '已失效' }
const rewardStatusType = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
const rewardStats = computed(() => ({
  totalCount: rewards.value.length,
  pendingCount: rewards.value.filter(r => r.status === 1).length,
  claimedCount: rewards.value.filter(r => r.status === 2).length
}))

const allTags = [
  '亲子友好', '老年服务', '文化活动', '体育赛事', '教育资源', '健康社区',
  '公益活动', '科技创新', '环保绿色', '商业活跃', '居民参与度高', '节庆氛围浓',
  '便民服务', '文艺演出', '亲子活动', '健康讲座', '法律咨询', '志愿服务',
  '节日庆典', '技能培训', '邻里互助', '垃圾分类', '消防安全', '防诈骗宣传',
  '儿童托管', '家电维修', '居家养老', '社区团购', '心理健康', '运动健身'
]

const editForm = ref({
  community_name: '',
  community: '',
  contact_name: '',
  district: '',
  street: '',
  position: '',
  username: '',
  address: '',
  latitude: '',
  longitude: '',
  logo: '',
  imagesStr: '',
  logoImagesList: [],
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
    contact_name: profile.value.contact_name || '',
    district: profile.value.district || '',
    street: profile.value.street || '',
    position: profile.value.position || '',
    username: profile.value.username || '',
    address: profile.value.address || '',
    latitude: profile.value.latitude || '',
    longitude: profile.value.longitude || '',
    logo: profile.value.logo || '',
    imagesStr: imagesArray.join(','),
    logoImagesList: [],
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
    // 处理场地图片上传
    const images = editForm.value.imagesStr
      ? editForm.value.imagesStr.split(',').map(s => s.trim()).filter(Boolean)
      : []
    // 如果有新上传的图片，先上传
    const newImages = editForm.value.logoImagesList || []
    for (const file of newImages) {
      if (file.raw) {
        try {
          const res = await uploadImage(file.raw)
          images.push(res.data.url)
        } catch {}
      }
    }
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
      tags: editForm.value.tagsList,
      contact_name: editForm.value.contact_name,
      community_name: editForm.value.community_name,
      community: editForm.value.community,
      latitude: editForm.value.latitude ? parseFloat(editForm.value.latitude) : null,
      longitude: editForm.value.longitude ? parseFloat(editForm.value.longitude) : null
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
  // 从 URL 参数切换 Tab（来自导航下拉的「我的收藏」「我的奖励」）
  const tab = new URLSearchParams(window.location.search).get('tab')
  if (tab === 'favorites' || tab === 'rewards') {
    infoTab.value = tab
  }
})

// 加载收藏列表
async function loadFavorites() {
  favLoading.value = true
  try {
    const res = await getMyFavorites()
    favorites.value = res.data?.list || res.data || []
  } catch {
    favorites.value = []
  } finally {
    favLoading.value = false
  }
}

// 查看收藏的资源详情
function viewFavResource(item) {
  const id = item.resource_id || item.id
  router.push(`/community/resources/${id}`)
}

// Logo上传前检查
function beforeLogoUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt2M) ElMessage.error('图片大小不能超过2MB')
  return isImage && isLt2M
}

// 上传Logo
async function uploadLogo(options) {
  try {
    const res = await uploadImage(options.file)
    editForm.value.logo = res.data.url
    ElMessage.success('Logo上传成功')
  } catch {
    ElMessage.error('Logo上传失败')
  }
}

// 监听切换到收藏tab时加载
watch(infoTab, (newTab) => {
  if (newTab === 'favorites') {
    loadFavorites()
  } else if (newTab === 'rewards') {
    loadRewards()
  }
})

// 奖励相关函数
async function loadRewards() {
  rewardLoading.value = true
  try {
    const res = await getRewards({ page: rewardPage.value, pageSize: rewardPageSize })
    rewards.value = res.data?.list || res.data || []
    rewardTotal.value = res.data?.pagination?.total || rewards.value.length
  } catch {
    rewards.value = []
  } finally {
    rewardLoading.value = false
  }
}

function formatRewardTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleClaimReward(item) {
  try {
    await claimReward({ id: item.id })
    ElMessage.success('已确认领取奖励')
    loadRewards()
  } catch {
    ElMessage.error('领取失败，请重试')
  }
}

function onRewardPageChange(page) {
  rewardPage.value = page
  loadRewards()
}
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.page h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.profile-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.avatar-area { margin-bottom: 16px; }
.community-name { font-size: 17px; font-weight: 700; margin-top: 10px; }
.district-name { font-size: 13px; color: #909399; margin-top: 4px; }
.stats-row { display: flex; justify-content: space-around; margin: 16px 0; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.quick-links { display: flex; gap: 8px; margin-top: 10px; justify-content: center; }
.quick-link-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; background: #f5f7fa; color: #606266; font-size: 13px; cursor: pointer; transition: all 0.2s; flex: 1; justify-content: center; }
.quick-link-item:hover { background: #ecf5ff; color: #409EFF; }
.stat-item { text-align: center; }
.stat-val { font-size: 22px; font-weight: 700; color: #1a56db; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.tag-list { display: flex; flex-wrap: wrap; }
.tag-selector { display: flex; flex-wrap: wrap; }
.favorites-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.fav-card { cursor: pointer; transition: transform 0.2s; }
.fav-card:hover { transform: translateY(-2px); }
.fav-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.fav-info { flex: 1; min-width: 0; }
.fav-title { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.fav-merchant { font-size: 12px; color: #409EFF; }
.fav-star { font-size: 18px; color: #f56c6c; }
.fav-star.active { color: #f56c6c; }
.fav-desc { font-size: 13px; color: #606266; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
/* 奖励样式 */
.reward-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.reward-stat-item { background: #f5f7fa; border-radius: 8px; padding: 12px; text-align: center; }
.reward-stat-value { font-size: 24px; font-weight: 700; }
.reward-stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.rewards-list { display: flex; flex-direction: column; gap: 12px; }
.reward-card { border-radius: 8px; }
.reward-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.reward-time { font-size: 12px; color: #909399; }
.reward-body { display: flex; gap: 12px; }
.reward-icon { font-size: 28px; line-height: 1; }
.reward-info { flex: 1; }
.reward-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.reward-desc { font-size: 13px; color: #606266; margin-bottom: 6px; }
.reward-meta { font-size: 12px; color: #909399; display: flex; gap: 12px; flex-wrap: wrap; }
.reward-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; text-align: right; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.upload-item { display: flex; align-items: center; gap: 12px; }
.logo-uploader { border: 1px dashed #d9d9d9; border-radius: 8px; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s; }
.logo-uploader:hover { border-color: #409EFF; }
.logo-uploader-icon { font-size: 24px; color: #8c8c8c; }
.uploaded-logo { width: 78px; height: 78px; object-fit: cover; border-radius: 6px; }
.upload-tip { font-size: 12px; color: #909399; }
.map-location-input { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }

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
