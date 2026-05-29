<template>
  <div class="profile-page" v-loading="loading">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-avatar" @click="openEditDrawer">
        <el-avatar :size="64" :src="userInfo.logo || ''" @error="() => true">
          <el-icon :size="32"><UserFilled /></el-icon>
        </el-avatar>
        <div class="edit-avatar-mask">
          <el-icon><Camera /></el-icon>
        </div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ userInfo.real_name || userInfo.username || '社区用户' }}</div>
        <div class="user-phone">
          <el-icon><Phone /></el-icon>
          {{ maskPhone(userInfo.phone) }}
        </div>
        <div class="user-community" v-if="userInfo.community_name || userInfo.community">
          <el-icon><Location /></el-icon>
          {{ userInfo.community_name || userInfo.community || '' }}
        </div>
      </div>
      <div class="user-badge" v-if="userInfo.role_name">
        <el-tag size="small" type="success" effect="plain">{{ userInfo.role_name }}</el-tag>
      </div>
    </div>

    <!-- 社区基本资料显示 -->
    <div class="info-section">
      <div class="section-header">
        <span class="section-title">社区资料</span>
        <el-button type="primary" link size="small" @click="openEditDrawer">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
      </div>
      <div class="info-grid">
        <div class="info-item" v-if="userInfo.district">
          <span class="info-label">所在区</span>
          <span class="info-value">{{ userInfo.district }}</span>
        </div>
        <div class="info-item" v-if="userInfo.street">
          <span class="info-label">街道</span>
          <span class="info-value">{{ userInfo.street }}</span>
        </div>
        <div class="info-item" v-if="userInfo.community_name || userInfo.community">
          <span class="info-label">社区</span>
          <span class="info-value">{{ userInfo.community_name || userInfo.community }}</span>
        </div>
        <div class="info-item" v-if="userInfo.position">
          <span class="info-label">职位</span>
          <span class="info-value">{{ userInfo.position }}</span>
        </div>
        <div class="info-item" v-if="userInfo.households">
          <span class="info-label">户数</span>
          <span class="info-value">{{ userInfo.households }} 户</span>
        </div>
        <div class="info-item" v-if="userInfo.address">
          <span class="info-label">地址</span>
          <span class="info-value">{{ userInfo.address }}</span>
        </div>
        <div class="info-item" v-if="userInfo.family_ratio">
          <span class="info-label">家庭占比</span>
          <span class="info-value">{{ userInfo.family_ratio }}%</span>
        </div>
        <div class="info-item" v-if="userInfo.elderly_ratio">
          <span class="info-label">老年占比</span>
          <span class="info-value">{{ userInfo.elderly_ratio }}%</span>
        </div>
        <div class="info-item" v-if="userInfo.tags && userInfo.tags.length">
          <span class="info-label">标签</span>
          <div class="info-tags">
            <el-tag v-for="tag in userInfo.tags" :key="tag" size="small" effect="plain" type="success">{{ tag }}</el-tag>
          </div>
        </div>
        <div class="info-item" v-if="userInfo.description" style="grid-column: 1 / -1;">
          <span class="info-label">简介</span>
          <span class="info-value desc">{{ userInfo.description }}</span>
        </div>
      </div>
      <div class="info-empty" v-if="!hasProfileInfo">
        <el-empty description="暂未完善社区资料" :image-size="60">
          <el-button type="primary" size="small" @click="openEditDrawer">立即完善</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-grid">
      <div class="stat-cell" @click="goTo('/community/demands')">
        <div class="stat-num">{{ stats.demands }}</div>
        <div class="stat-label">我的需求</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/favorites')">
        <div class="stat-num">{{ stats.favorites }}</div>
        <div class="stat-label">我的收藏</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/rewards')">
        <div class="stat-num">{{ stats.rewards }}</div>
        <div class="stat-label">我的奖励</div>
      </div>
      <div class="stat-cell" @click="goTo('/community/messages')">
        <div class="stat-num">{{ stats.messages }}</div>
        <div class="stat-label">消息通知</div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-title">我的服务</div>
      <div class="menu-grid">
        <div class="menu-item" @click="goTo('/community/demands')">
          <div class="menu-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Document /></el-icon>
          </div>
          <span>我的需求</span>
        </div>
        <div class="menu-item" @click="goTo('/community/favorites')">
          <div class="menu-icon" style="background: #fff0f6; color: #eb2f96;">
            <el-icon><Star /></el-icon>
          </div>
          <span>我的收藏</span>
        </div>
        <div class="menu-item" @click="goTo('/community/rewards')">
          <div class="menu-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Present /></el-icon>
          </div>
          <span>我的奖励</span>
        </div>
        <div class="menu-item" @click="goTo('/community/messages')">
          <div class="menu-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <span>消息中心</span>
        </div>
      </div>
    </div>

    <!-- 列表菜单 -->
    <div class="list-menu">
      <div class="list-item" @click="goTo('/community/demands/publish')">
        <div class="list-icon" style="color: #07c160;">
          <el-icon><Plus /></el-icon>
        </div>
        <span>发布新需求</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="openEditDrawer">
        <div class="list-icon" style="color: #07c160;">
          <el-icon><Edit /></el-icon>
        </div>
        <span>编辑社区资料</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #409EFF;">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <span>管理小区</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #fa8c16;">
          <el-icon><MapLocation /></el-icon>
        </div>
        <span>管理场地空间</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #909399;">
          <el-icon><Lock /></el-icon>
        </div>
        <span>修改密码</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="list-item" @click="comingSoon">
        <div class="list-icon" style="color: #909399;">
          <el-icon><Setting /></el-icon>
        </div>
        <span>设置</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <el-button type="danger" plain class="logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>

    <!-- 底部安全区 -->
    <div class="safe-area-bottom"></div>

    <!-- 编辑资料抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="编辑社区资料"
      direction="rtl"
      size="90%"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-position="top" class="edit-form" @submit.prevent="saveProfile">
        <!-- 基本信息 -->
        <div class="form-section-title">基本信息</div>
        <el-form-item label="负责人姓名" required>
          <el-input v-model="editForm.real_name" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="editForm.position" placeholder="如：社区书记、社区主任" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <div class="region-select-group">
            <el-select v-model="editForm.district" placeholder="区/开发区" @change="onDistrictChange">
              <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
            </el-select>
            <el-select v-model="editForm.street" placeholder="街道/镇" :disabled="!editForm.district" @change="onStreetChange">
              <el-option v-for="s in filteredStreets" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-select v-model="editForm.community" placeholder="社区" :disabled="!editForm.street">
              <el-option v-for="c in filteredCommunities" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="editForm.address" placeholder="请输入详细地址" />
        </el-form-item>

        <!-- 社区画像 -->
        <div class="form-section-title">社区画像</div>
        <div class="form-row">
          <el-form-item label="总户数">
            <el-input v-model="editForm.households" type="number" placeholder="如：3000" />
          </el-form-item>
          <el-form-item label="在营商家数">
            <el-input v-model="editForm.merchant_count" type="number" placeholder="如：50" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="家庭用户占比(%)">
            <el-input v-model="editForm.family_ratio" type="number" placeholder="如：75" />
          </el-form-item>
          <el-form-item label="老年用户占比(%)">
            <el-input v-model="editForm.elderly_ratio" type="number" placeholder="如：20" />
          </el-form-item>
        </div>
        <el-form-item label="公共空间面积(m²)">
          <el-input v-model="editForm.public_space_area" type="number" placeholder="请输入面积" />
        </el-form-item>

        <!-- 配套设施 -->
        <div class="form-section-title">配套设施</div>
        <div class="facility-checks">
          <el-checkbox v-model="editForm.has_outdoor_plaza">户外广场</el-checkbox>
          <el-checkbox v-model="editForm.has_commercial">商业设施</el-checkbox>
          <el-checkbox v-model="editForm.has_school">学校/幼儿园</el-checkbox>
          <el-checkbox v-model="editForm.has_park">公园/绿地</el-checkbox>
        </div>

        <!-- 社区介绍 -->
        <div class="form-section-title">社区介绍</div>
        <el-form-item label="社区简介">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请简要介绍社区特色、居民构成等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="社区标签">
          <div class="tags-input">
            <el-tag
              v-for="(tag, idx) in editForm.tags"
              :key="idx"
              closable
              type="success"
              effect="plain"
              @close="editForm.tags.splice(idx, 1)"
              style="margin-right: 8px; margin-bottom: 4px;"
            >{{ tag }}</el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              style="width: 100px;"
              placeholder="输入标签"
              @keyup.enter="addTag"
              @blur="addTag"
            />
            <el-button v-else size="small" @click="showTagInput">
              + 添加标签
            </el-button>
          </div>
        </el-form-item>

        <!-- Logo -->
        <div class="form-section-title">社区Logo</div>
        <el-form-item label="Logo URL">
          <el-input v-model="editForm.logo" placeholder="输入Logo图片地址" />
        </el-form-item>
        <el-form-item label="社区图片">
          <div class="images-input">
            <div class="image-item" v-for="(img, idx) in editForm.images" :key="idx">
              <el-image :src="img" fit="cover" style="width: 80px; height: 80px; border-radius: 8px;" />
              <el-icon class="image-remove" @click="editForm.images.splice(idx, 1)"><CircleClose /></el-icon>
            </div>
            <div class="image-add" @click="addImage">
              <el-icon :size="20"><Plus /></el-icon>
              <span>添加</span>
            </div>
          </div>
        </el-form-item>

        <!-- 保存按钮 -->
        <div class="form-actions">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存资料</el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  UserFilled, Camera, Phone, Location, Edit,
  Document, Star, Present, ChatDotRound,
  Plus, OfficeBuilding, MapLocation, Lock, Setting,
  ArrowRight, SwitchButton, CircleClose
} from '@element-plus/icons-vue'
import { getUserInfo } from '@/utils/useAuth'
import { getProfile, updateProfile, getMyDemands, getMyFavorites, getRewards, getUnreadCount } from '@/api/community'
import { getRegions } from '@/api/public'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const userInfo = ref({})
const stats = ref({ demands: 0, favorites: 0, rewards: 0, messages: 0 })

// 编辑抽屉
const drawerVisible = ref(false)
const editForm = reactive({
  real_name: '',
  position: '',
  district: '',
  street: '',
  community: '',
  address: '',
  households: '',
  merchant_count: '',
  family_ratio: '',
  elderly_ratio: '',
  public_space_area: '',
  has_outdoor_plaza: false,
  has_commercial: false,
  has_school: false,
  has_park: false,
  description: '',
  tags: [],
  logo: '',
  images: []
})

// 地区数据
const allRegions = ref([])
const districts = computed(() => {
  const topLevel = allRegions.value.filter(r => !r.parent_id || r.parent_id === 0 || r.parent_id === '0')
  if (topLevel.length === 1 && (topLevel[0].name === '武汉市' || topLevel[0].region_name === '武汉市')) {
    return allRegions.value
      .filter(r => r.parent_id === topLevel[0].id)
      .map(r => r.name || r.region_name)
      .filter(Boolean)
  }
  return topLevel.map(r => r.name || r.region_name).filter(Boolean)
})
const filteredStreets = computed(() => {
  if (!editForm.district) return []
  const district = allRegions.value.find(r => (r.name || r.region_name) === editForm.district)
  if (!district) return []
  return allRegions.value
    .filter(r => r.parent_id === district.id)
    .map(r => ({ label: r.name || r.region_name, value: r.name || r.region_name }))
})
const filteredCommunities = computed(() => {
  if (!editForm.street) return []
  const street = allRegions.value.find(r => (r.name || r.region_name) === editForm.street)
  if (!street) return []
  return allRegions.value
    .filter(r => r.parent_id === street.id)
    .map(r => ({ label: r.name || r.region_name, value: r.name || r.region_name }))
})

function onDistrictChange() {
  editForm.street = ''
  editForm.community = ''
}
function onStreetChange() {
  editForm.community = ''
}

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref(null)

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => tagInputRef.value?.focus?.())
}

function addTag() {
  const val = tagInputValue.value.trim()
  if (val && !editForm.tags.includes(val)) {
    editForm.tags.push(val)
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

function addImage() {
  const url = window.prompt ? null : ''
  // 使用 prompt 弹窗输入图片URL（简单方案）
  ElMessageBox.prompt('请输入图片URL', '添加社区图片', {
    confirmButtonText: '添加',
    cancelButtonText: '取消',
    inputPlaceholder: 'https://...'
  }).then(({ value }) => {
    if (value && value.trim()) {
      if (!editForm.images) editForm.images = []
      editForm.images.push(value.trim())
    }
  }).catch(() => {})
}

// 是否有资料信息
const hasProfileInfo = computed(() => {
  const u = userInfo.value
  return u.community || u.community_name || u.district || u.street || u.position || u.address || u.description
})

// 判断是否从弹窗跳转过来完善资料
const isCompleteProfile = computed(() => route.query.complete === '1')

function openEditDrawer() {
  // 用当前用户数据填充表单
  const u = userInfo.value
  editForm.real_name = u.real_name || u.username || ''
  editForm.position = u.position || ''
  editForm.district = u.district || ''
  editForm.street = u.street || ''
  editForm.community = u.community || ''
  editForm.address = u.address || ''
  editForm.households = u.households || ''
  editForm.merchant_count = u.merchant_count || ''
  editForm.family_ratio = u.family_ratio || ''
  editForm.elderly_ratio = u.elderly_ratio || ''
  editForm.public_space_area = u.public_space_area || ''
  editForm.has_outdoor_plaza = !!u.has_outdoor_plaza
  editForm.has_commercial = !!u.has_commercial
  editForm.has_school = !!u.has_school
  editForm.has_park = !!u.has_park
  editForm.description = u.description || ''
  editForm.tags = u.tags ? [...u.tags] : []
  editForm.logo = u.logo || ''
  editForm.images = u.images ? [...u.images] : []
  drawerVisible.value = true
}

async function saveProfile() {
  if (!editForm.real_name) {
    ElMessage.warning('请填写负责人姓名')
    return
  }
  saving.value = true
  try {
    const payload = {
      real_name: editForm.real_name,
      position: editForm.position,
      district: editForm.district,
      street: editForm.street,
      community: editForm.community,
      address: editForm.address,
      households: editForm.households ? Number(editForm.households) : null,
      merchant_count: editForm.merchant_count ? Number(editForm.merchant_count) : null,
      family_ratio: editForm.family_ratio ? Number(editForm.family_ratio) : null,
      elderly_ratio: editForm.elderly_ratio ? Number(editForm.elderly_ratio) : null,
      public_space_area: editForm.public_space_area ? Number(editForm.public_space_area) : null,
      has_outdoor_plaza: editForm.has_outdoor_plaza ? 1 : 0,
      has_commercial: editForm.has_commercial ? 1 : 0,
      has_school: editForm.has_school ? 1 : 0,
      has_park: editForm.has_park ? 1 : 0,
      description: editForm.description,
      tags: editForm.tags,
      logo: editForm.logo,
      images: editForm.images
    }
    await updateProfile(payload)
    ElMessage.success('资料保存成功')
    drawerVisible.value = false
    // 重新加载资料
    await loadProfile()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || '保存失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const goTo = (path) => {
  router.push(path)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const cached = getUserInfo('community')
    if (cached) {
      userInfo.value = cached
    }
    const res = await getProfile()
    if (res.code === 200 || res.code === 0) {
      userInfo.value = res.data || res
      localStorage.setItem('community_info', JSON.stringify(userInfo.value))
    }
  } catch (err) {
    console.error('获取个人资料失败:', err)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const [demandsRes, favsRes, rewardsRes, msgRes] = await Promise.allSettled([
      getMyDemands({ pageSize: 1 }),
      getMyFavorites({ pageSize: 1 }),
      getRewards({ pageSize: 1 }),
      getUnreadCount()
    ])
    stats.value.demands = demandsRes.value?.data?.pagination?.total || 0
    stats.value.favorites = favsRes.value?.data?.pagination?.total || 0
    stats.value.rewards = rewardsRes.value?.data?.pagination?.total || 0
    stats.value.messages = msgRes.value?.data?.count || msgRes.value?.data || 0
  } catch (err) {
    console.error('获取统计数据失败:', err)
  }
}

async function loadRegions() {
  try {
    const res = await getRegions()
    allRegions.value = res.data || []
  } catch {
    allRegions.value = []
  }
}

const comingSoon = () => {
  ElMessage.info('功能开发中，敬请期待')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('community_token')
    localStorage.removeItem('community_info')
    ElMessage.success('已退出登录')
    router.push('/community')
  }).catch(() => {})
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadStats(), loadRegions()])
  // 如果是从弹窗跳转过来完善资料的，自动打开编辑抽屉
  if (isCompleteProfile.value) {
    openEditDrawer()
  }
})
</script>

<style scoped>
.profile-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 20px;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  padding: 32px 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.user-avatar {
  position: relative;
  cursor: pointer;
}

.user-avatar :deep(.el-avatar) {
  border: 3px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.9);
  color: #07c160;
}

.edit-avatar-mask {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}

.user-info {
  flex: 1;
  color: #fff;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 13px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.user-community {
  font-size: 12px;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.user-badge :deep(.el-tag) {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
}

/* 社区资料展示区 */
.info-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.info-value.desc {
  line-height: 1.6;
  color: #666;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.info-empty {
  padding: 10px 0;
}

/* 数据统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #e8e8e8;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.stat-cell {
  background: #fff;
  padding: 16px 4px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}

.stat-cell:active {
  background: #f5f5f5;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

/* 菜单区域 */
.menu-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
}

.menu-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 8px;
  transition: background 0.2s;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.menu-item span {
  font-size: 12px;
  color: #666;
}

/* 列表菜单 */
.list-menu {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:active {
  background: #f5f5f5;
}

.list-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.list-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.list-arrow {
  color: #ccc;
  font-size: 16px;
}

/* 退出登录 */
.logout-section {
  margin: 24px 12px;
}

.logout-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 15px;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
}

/* 编辑表单样式 */
.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #07c160;
  margin: 20px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #07c160;
}

.form-section-title:first-child {
  margin-top: 0;
}

.region-select-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.region-select-group .el-select {
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.facility-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.images-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-item {
  position: relative;
}

.image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 18px;
  color: #fff;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add {
  width: 80px;
  height: 80px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  font-size: 12px;
  gap: 4px;
  transition: border-color 0.2s;
}

.image-add:hover {
  border-color: #07c160;
  color: #07c160;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .stats-grid {
    margin: 8px;
  }
  .menu-section,
  .list-menu,
  .info-section {
    margin: 8px;
  }
  .logout-section {
    margin: 16px 8px;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
