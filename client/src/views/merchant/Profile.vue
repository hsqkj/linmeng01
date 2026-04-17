<template>
  <div class="page">
    <h2>{{ isExpert ? '专家中心' : '商家中心' }}</h2>

    <el-row :gutter="20" v-loading="loading" element-loading-text="加载中...">
      <!-- 左侧信息卡 -->
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" :src="profile.logo">
              <el-icon :size="40"><Shop /></el-icon>
            </el-avatar>
            <div class="merchant-name">{{ profile.company_name }}</div>
            <div class="merchant-type">
              <el-tag v-if="isExpert" size="small" style="margin-right:4px">专家</el-tag>
              {{ profile.industry || '未填写' }}
            </div>
            <el-tag type="warning" style="margin-top:8px">{{ memberLevelName[profile.member_level] || '普通会员' }}</el-tag>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ stats.resourceCount }}</div><div class="stat-label">发布资源</div></div>
            <div class="stat-item"><div class="stat-val">{{ stats.matchings }}</div><div class="stat-label">撮合成功</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.view_count || 0 }}</div><div class="stat-label">总浏览</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑{{ isExpert ? '专家' : '商家' }}资料</el-button>
        </div>
      </el-col>

      <!-- 右侧详细信息 -->
      <el-col :xs="24" :sm="24" :md="16">
        <el-card v-if="!editing">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">{{ isExpert ? '专家详细资料' : '商家详细资料' }}</span>
              <el-button text type="primary" @click="startEdit"><el-icon><Edit /></el-icon> 编辑</el-button>
            </div>
          </template>
          <el-tabs v-model="infoTab">
            <!-- 基本信息Tab -->
            <el-tab-pane :label="isExpert ? '基本信息' : '基本信息'" name="basic">
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="isExpert ? '姓名' : '企业名称'">{{ profile.company_name }}</el-descriptions-item>
                <el-descriptions-item label="行业分类">{{ profile.industry || '未填写' }}</el-descriptions-item>
                <!-- 商家独有 -->
                <el-descriptions-item v-if="!isExpert" label="企业规模">{{ profile.scale || '未填写' }}</el-descriptions-item>
                <el-descriptions-item :label="isExpert ? '手机号' : '联系人'">{{ isExpert ? (profile.contact_name || profile.phone) : (profile.contact_name || '未填写') }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ profile.phone }}</el-descriptions-item>
                <el-descriptions-item v-if="!isExpert" label="企业地址" :span="2">{{ profile.address || '未填写' }}</el-descriptions-item>
                <!-- 专家独有 -->
                <el-descriptions-item v-if="isExpert" label="社会身份">{{ profile.social_identity || '未填写' }}</el-descriptions-item>
                <el-descriptions-item v-if="isExpert" label="荣誉资质">{{ profile.honors || '未填写' }}</el-descriptions-item>
                <!-- 通用 -->
                <el-descriptions-item label="Logo/头像">
                  <el-avatar :size="40" :src="profile.logo" />
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="Number(profile.status) === 1 ? 'success' : 'warning'" size="small">
                    {{ Number(profile.status) === 1 ? '已通过' : Number(profile.status) === 2 ? '已禁用' : '待审核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="isExpert ? '个人简介' : '企业简介'" :span="2">{{ profile.description || '暂无简介' }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <!-- 修改密码Tab -->
            <el-tab-pane label="修改密码" name="password">
              <div class="password-form">
                <el-alert type="info" :closable="false" style="margin-bottom: 16px">
                  为保障账号安全，请定期更换密码。新密码长度不能少于6位。
                </el-alert>
                <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" style="max-width: 400px">
                  <el-form-item label="旧密码" prop="oldPassword">
                    <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
                  </el-form-item>
                  <el-form-item label="新密码" prop="newPassword">
                    <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
                  </el-form-item>
                  <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading">确认修改</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>

            <!-- 专家照片Tab（仅专家） -->
            <el-tab-pane v-if="isExpert" label="照片资料" name="photos">
              <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:12px">
                <div style="text-align:center">
                  <div class="img-label">个人照片</div>
                  <el-image v-if="profile.logo" :src="profile.logo" style="width:140px;height:180px;border-radius:8px" fit="cover" :preview-src-list="[profile.logo]" />
                  <el-empty v-else description="暂未上传" :image-size="50" />
                </div>
                <div style="text-align:center">
                  <div class="img-label">身份证照片</div>
                  <template v-if="idCardImages.length">
                    <el-image v-for="(img, i) in idCardImages" :key="i" :src="img" style="width:140px;height:90px;border-radius:8px;margin-bottom:8px" fit="cover" :preview-src-list="idCardImages" />
                  </template>
                  <el-empty v-else description="暂未上传" :image-size="50" />
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">编辑照片</el-button>
            </el-tab-pane>

            <!-- 产品/服务介绍Tab（仅商家） -->
            <el-tab-pane v-if="!isExpert" label="产品/服务" name="gallery">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">展示您的产品或服务，让社区更了解您的业务</p>
              <el-empty v-if="!galleryList.length" description="暂无产品/服务介绍" :image-size="60" />
              <div v-else class="products-list">
                <div v-for="(product, idx) in galleryList" :key="idx" class="product-card">
                  <div v-if="product.image" class="product-card-image">
                    <el-image :src="product.image" fit="cover" style="width:100%;height:160px;border-radius:6px" :preview-src-list="product.image ? [product.image] : []" />
                  </div>
                  <div v-if="product.title || product.description" class="product-card-content">
                    <h4 v-if="product.title" class="product-card-title">{{ product.title }}</h4>
                    <p v-if="product.description" class="product-card-desc">{{ product.description }}</p>
                  </div>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">编辑产品/服务</el-button>
            </el-tab-pane>

            <el-tab-pane label="我的标签" name="tags">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">选择与您{{ isExpert ? '的专长' : '的业务' }}相关的标签，帮助社区更精准匹配</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <el-tag v-for="tag in parsedTags" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
                <span v-if="!parsedTags.length" style="color:#909399;font-size:13px">暂无标签</span>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">编辑标签</el-button>
            </el-tab-pane>

            <el-tab-pane label="会员权益" name="member">
              <div class="member-info" v-if="profile.member_level > 0">
                <div class="member-header">
                  <el-tag type="warning" size="large">{{ memberLevelName[profile.member_level] || '普通会员' }}</el-tag>
                  <span style="color:#909399;font-size:13px;margin-left:8px">有效期：{{ profile.member_expire_at ? '至' + profile.member_expire_at : memberLevelValidity[profile.member_level] + '个月' }}</span>
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
                <el-empty :description="`您当前是${memberLevelName[profile.member_level] || '普通会员'}，升级后可享受更多权益`" :image-size="60">
                  <el-button type="primary" @click="$router.push('/merchant/member')">立即升级</el-button>
                </el-empty>
              </div>
            </el-tab-pane>
            <el-tab-pane label="我的收藏" name="favorites">
              <div class="favorites-list" v-loading="favLoading">
                <el-empty v-if="!favLoading && favorites.length === 0" description="暂无收藏需求" :image-size="80" />
                <el-card v-for="item in favorites" :key="item.id" shadow="hover" class="fav-card" @click="viewFavDemand(item)">
                  <div class="fav-header">
                    <div class="fav-info">
                      <div class="fav-title">{{ item.demand_title || item.title }}</div>
                      <div class="fav-meta">
                        <el-tag size="small" type="warning">{{ item.demand_type_name || item.demand_type }}</el-tag>
                        <span class="fav-community">{{ item.community_name }}</span>
                      </div>
                    </div>
                    <div class="fav-right">
                      <div class="fav-score">
                        <span class="score-label">匹配度</span>
                        <span v-for="n in 5" :key="n" :class="['heart', { filled: n <= (item.matchHearts || 0) }]">♥</span>
                      </div>
                      <el-icon class="fav-star active"><Star /></el-icon>
                    </div>
                  </div>
                  <p class="fav-desc">{{ item.demand_content || item.content }}</p>
                </el-card>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 编辑表单 -->
        <el-card v-else>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">编辑{{ isExpert ? '专家' : '商家' }}资料</span>
              <el-button text @click="editing=false">取消</el-button>
            </div>
          </template>
          <el-form :model="editForm" label-width="130px">
            <el-divider content-position="left">{{ isExpert ? '基本信息' : '基本信息' }}</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item :label="isExpert ? '姓名' : '企业名称'" required>
                  <el-input v-model="editForm.company_name" :disabled="isExpert" :placeholder="isExpert ? '姓名不可修改' : ''" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :label="isExpert ? '专家类型' : '行业分类'">
                  <el-select v-model="editForm.industry" :placeholder="isExpert ? '请选择专家类型' : '请选择行业分类'" style="width:100%" clearable>
                    <el-option v-for="t in (isExpert ? expertTypes : industryTypes)" :key="t" :label="t" :value="t" />
                  </el-select>
                  <div v-if="isExpert && expertTypes.length === 0" style="color: #909399; font-size: 12px; margin-top: 4px;">正在加载专家类型...</div>
                </el-form-item>
              </el-col>
              <!-- 商家独有字段 -->
              <el-col v-if="!isExpert" :xs="24" :sm="12">
                <el-form-item label="企业规模">
                  <el-input v-model="editForm.scale" placeholder="如：50~200人" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :label="isExpert ? '手机号' : '联系人'" required>
                  <el-input v-model="editForm.phone" :disabled="isExpert" :placeholder="isExpert ? '手机号不可修改' : ''" />
                </el-form-item>
              </el-col>
              <el-col v-if="!isExpert" :xs="24" :sm="12">
                <el-form-item label="联系人">
                  <el-input v-model="editForm.contact_name" />
                </el-form-item>
              </el-col>
              <!-- 商家独有 -->
              <el-col v-if="!isExpert" :span="24">
                <el-form-item label="企业地址">
                  <el-input v-model="editForm.address" placeholder="详细地址" />
                </el-form-item>
              </el-col>
              <!-- 照片上传（专家有头像+身份证，商家只有Logo） -->
              <el-col v-if="isExpert" :span="24">
                <el-form-item label="个人照片">
                  <el-upload class="avatar-uploader" action="/api/public/upload-native" :show-file-list="false" :on-success="(r) => { editForm.logo = r.data?.url || r.url; }" accept="image/*" name="image">
                    <el-avatar :size="80" :src="editForm.logo" v-if="editForm.logo" />
                    <div v-else class="upload-placeholder">
                      <el-icon :size="24"><Plus /></el-icon>
                      <span>上传照片</span>
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
              <el-col v-if="isExpert" :span="24">
                <el-form-item label="身份证照片">
                  <el-upload action="/api/public/upload-native" :show-file-list="false" :on-success="(r) => { editForm.idCardPhoto = r.data?.url || r.url; }" accept="image/*" name="image">
                    <div class="upload-placeholder" style="width:180px;height:110px">
                      <template v-if="editForm.idCardPhoto">
                        <el-image :src="editForm.idCardPhoto" style="width:100%;height:100%;border-radius:6px" fit="cover" />
                      </template>
                      <template v-else>
                        <el-icon :size="24"><Plus /></el-icon>
                        <span>上传身份证</span>
                      </template>
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
              <el-col v-if="!isExpert" :span="24">
                <el-form-item label="企业Logo">
                  <el-upload class="avatar-uploader" action="/api/public/upload-native" :show-file-list="false" :on-success="(r) => { editForm.logo = r.data?.url || r.url; }" accept="image/*" name="image">
                    <el-avatar :size="80" :src="editForm.logo" v-if="editForm.logo" />
                    <div v-else class="upload-placeholder">
                      <el-icon :size="24"><Plus /></el-icon>
                      <span>上传Logo</span>
                    </div>
                  </el-upload>
                </el-form-item>
              </el-col>
              <el-col v-if="!isExpert" :span="24">
                <el-form-item label="营业执照">
                  <div v-if="editForm.business_license" style="display:flex;align-items:center;gap:12px">
                    <el-image :src="editForm.business_license" style="width:160px;height:100px;border-radius:6px" fit="cover" :preview-src-list="[editForm.business_license]" />
                    <span style="color:#909399;font-size:12px">营业执照不可修改</span>
                  </div>
                  <span v-else style="color:#909399">暂无营业执照</span>
                </el-form-item>
              </el-col>
              <el-col v-if="!isExpert" :span="24">
                <el-form-item label="产品/服务介绍">
                  <div class="products-editor">
                    <div v-for="(product, idx) in editForm.products" :key="idx" class="product-item">
                      <div class="product-header">
                        <span class="product-num">产品 {{ idx + 1 }}</span>
                        <el-button text type="danger" size="small" @click="removeProduct(idx)" :disabled="editForm.products.length <= 1">
                          <el-icon><Delete /></el-icon> 删除
                        </el-button>
                      </div>
                      <div class="product-body">
                        <el-input v-model="product.title" placeholder="产品/服务名称（选填）" style="margin-bottom:8px" />
                        <el-input v-model="product.description" type="textarea" :rows="2" placeholder="产品/服务详细介绍（选填）" style="margin-bottom:8px" />
                        <div class="product-image-upload">
                          <el-upload
                            action="/api/public/upload-native"
                            :show-file-list="false"
                            :on-success="(r) => { product.image = r.data?.url || r.url; }"
                            accept="image/*"
                            name="image"
                          >
                            <div v-if="product.image" class="product-image-preview">
                              <el-image :src="product.image" style="width:100%;height:100%;border-radius:6px" fit="cover" />
                              <div class="product-image-mask">
                                <el-icon><Edit /></el-icon> 更换图片
                              </div>
                            </div>
                            <div v-else class="product-image-placeholder">
                              <el-icon :size="24"><Plus /></el-icon>
                              <span>上传图片</span>
                            </div>
                          </el-upload>
                        </div>
                      </div>
                    </div>
                    <el-button type="primary" plain @click="addProduct" style="margin-top:8px">
                      <el-icon><Plus /></el-icon> 添加产品/服务
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="isExpert ? '个人简介' : '企业简介'">
                  <el-input v-model="editForm.description" type="textarea" :rows="3" :placeholder="isExpert ? '介绍您的专业背景、擅长领域等...' : '简要介绍企业主营业务、优势等...'" />
                </el-form-item>
              </el-col>
              <!-- 企业身份字段 -->
              <el-col :span="24">
                <el-form-item label="社会身份">
                  <el-input v-model="editForm.social_identity" type="textarea" :rows="2" placeholder="如：XX协会会员、XX机构合作方等" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="荣誉资质">
                  <el-input v-model="editForm.honors" type="textarea" :rows="2" placeholder="如：行业认证、荣誉证书、社会荣誉等" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="公司专家介绍">
                  <el-input v-model="editForm.expert_intro" type="textarea" :rows="3" placeholder="介绍公司的专家团队、专业背景、擅长领域等" />
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Shop, Edit, Star, Plus, Delete } from '@element-plus/icons-vue'
import { getProfile, updateProfile, updatePassword, getMyResources, toggleFavorite, getMyFavorites, getExpertTypes, getPublishTypes } from '@/api/merchant'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const infoTab = ref('basic')
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
const profile = ref({ company_type: '' })
const stats = ref({ resourceCount: 0, matchings: 0 })
const favorites = ref([])
const favLoading = ref(false)

const isExpert = computed(() => profile.value.company_type === 'expert')

// 会员等级名称（从 API 动态加载）
const memberLevelNameMap = ref({})
const memberLevelName = computed(() => memberLevelNameMap.value[profile.value?.member_level] || '普通会员')

// 会员等级对应的有效期（月数）
const memberLevelValidity = { 0: 3, 1: 3, 2: 12, 3: 12, 4: 12, 5: 12 }

// 行业分类（从 API 动态加载）
const industryTypes = ref([])

const expertTypes = ref([])

const allTags = ['亲子活动', '老年服务', '文化活动', '体育赛事', '教育培训', '健康医疗', '科技科普', '节庆活动', '环保公益', '商业推广', '社区建设', '志愿服务']

const memberBenefits = [
  { icon: '🔍', title: '查看联系方式' },
  { icon: '📊', title: '优先推荐' },
  { icon: '💬', title: '无限留言' },
  { icon: '🎁', title: '撮合奖励' }
]

// 解析标签（兼容数组和逗号分隔字符串）
const parsedTags = computed(() => {
  const tags = profile.value.tags
  if (!tags) return []
  // 如果已经是数组，直接返回
  if (Array.isArray(tags)) return tags
  // 如果是字符串，尝试解析
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return tags.split(',').filter(Boolean)
    }
  }
  return []
})

// 解析身份证图片
const idCardImages = computed(() => {
  const images = profile.value.images
  if (!images) return []
  // 如果已经是数组，直接返回
  if (Array.isArray(images)) return images.filter(Boolean)
  // 如果是字符串，尝试解析
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return images.split(',').filter(Boolean)
    }
  }
  return []
})

const galleryList = computed(() => {
  if (!profile.value.images) return []
  if (isExpert.value) return [] // 专家照片走 idCardImages
  const images = profile.value.images
  // 如果是产品对象数组
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'object') {
    return images.filter(p => p.image || p.title || p.description)
  }
  // 如果是纯图片数组
  if (Array.isArray(images)) return images.filter(Boolean)
  // 如果是字符串，尝试解析JSON
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
          return parsed.filter(p => p.image || p.title || p.description)
        }
        return parsed.filter(Boolean)
      }
    } catch {}
    // 旧格式逗号分隔
    return images.split(',').filter(Boolean)
  }
  return []
})

const editForm = ref({
  company_name: '',
  industry: '',
  scale: '',
  contact_name: '',
  phone: '',
  address: '',
  logo: '',
  business_license: '',
  idCardPhoto: '',
  description: '',
  social_identity: '',
  honors: '',
  expert_intro: '',
  tagsList: [],
  // 产品/服务介绍
  products: []
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await getProfile()
    console.log('Profile API response:', res.data)
    profile.value = res.data || { company_type: '' }
    console.log('Profile loaded, company_type:', profile.value.company_type, 'isExpert:', isExpert.value)
    // 同时加载资源数量
    try {
      const r = await getMyResources({ page: 1, pageSize: 1 })
      stats.value.resourceCount = r.data?.total || 0
    } catch {}
  } catch {
    ElMessage.error('加载资料失败')
  } finally {
    loading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }
  passwordLoading.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    passwordLoading.value = false
  }
}

function startEdit() {
  const tags = profile.value.tags
  const tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',')) : [])
  const images = profile.value.images
  // 解析产品/服务介绍
  let products = []
  if (images) {
    if (Array.isArray(images)) {
      // 如果是数组，可能是产品列表
      if (images.length > 0 && typeof images[0] === 'object') {
        products = images
      } else {
        // 旧格式的纯图片数组，转为简单格式
        products = images.filter(Boolean).map(img => ({ title: '', description: '', image: img }))
      }
    } else if (typeof images === 'string' && images.startsWith('[')) {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'object') {
            products = parsed
          } else {
            products = parsed.filter(Boolean).map(img => ({ title: '', description: '', image: img }))
          }
        }
      } catch {}
    }
  }

  editForm.value = {
    company_name: profile.value.company_name || '',
    industry: profile.value.industry || '',
    scale: profile.value.scale || '',
    contact_name: profile.value.contact_name || '',
    phone: profile.value.phone || '',
    address: profile.value.address || '',
    logo: profile.value.logo || '',
    business_license: profile.value.business_license || '',
    idCardPhoto: '',
    description: profile.value.description || '',
    social_identity: profile.value.social_identity || '',
    honors: profile.value.honors || '',
    expert_intro: profile.value.expert_intro || '',
    tagsList: tagsArray,
    products: products.length > 0 ? products : [{ title: '', description: '', image: '' }]
  }
  editing.value = true
  infoTab.value = 'basic'
}

function toggleTag(tag) {
  const idx = editForm.value.tagsList.indexOf(tag)
  if (idx >= 0) editForm.value.tagsList.splice(idx, 1)
  else editForm.value.tagsList.push(tag)
}

// 添加产品/服务
function addProduct() {
  editForm.value.products.push({ title: '', description: '', image: '' })
}

// 删除产品/服务
function removeProduct(index) {
  if (editForm.value.products.length > 1) {
    editForm.value.products.splice(index, 1)
  }
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
      contact_name: editForm.value.contact_name,
      phone: editForm.value.phone,
      logo: editForm.value.logo,
      description: editForm.value.description,
      social_identity: editForm.value.social_identity,
      honors: editForm.value.honors,
      expert_intro: editForm.value.expert_intro,
      tags: JSON.stringify(editForm.value.tagsList)
    }
    // 商家特有字段
    if (!isExpert.value) {
      data.scale = editForm.value.scale
      data.address = editForm.value.address
      // 产品/服务介绍：过滤空产品后保存为JSON
      const validProducts = editForm.value.products.filter(p => p.title || p.description || p.image)
      data.images = JSON.stringify(validProducts)
    }
    // 专家身份证照片
    if (isExpert.value && editForm.value.idCardPhoto) {
      data.images = JSON.stringify([editForm.value.idCardPhoto])
    }
    await updateProfile(data)
    profile.value = { ...profile.value, ...data }
    editing.value = false
    ElMessage.success('资料已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadExpertTypes()
  loadPublishTypes()
})

// 加载发布类型配置（会员等级、行业分类）
async function loadPublishTypes() {
  try {
    const res = await getPublishTypes()
    const data = res.data || {}
    // 加载会员等级配置
    if (data.member_levels && Array.isArray(data.member_levels)) {
      const map = {}
      data.member_levels.forEach(item => {
        map[item.level] = item.name
      })
      memberLevelNameMap.value = map
    }
    // 加载行业分类配置
    if (data.industry_types && Array.isArray(data.industry_types)) {
      industryTypes.value = data.industry_types
    }
  } catch (err) {
    console.error('加载发布类型配置失败:', err)
  }
}

// 加载专家类型列表
async function loadExpertTypes() {
  try {
    const res = await getExpertTypes()
    console.log('Expert types API response:', res.data)
    if (res.data && Array.isArray(res.data)) {
      // 只取启用的类型，并按排序号排序
      expertTypes.value = res.data
        .filter(t => t.status === 1 || t.status === '1' || t.status === undefined)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(t => t.name)
      console.log('Loaded expert types:', expertTypes.value)
    }
  } catch (err) {
    console.error('加载专家类型失败:', err)
  }
}

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

// 查看收藏的需求详情
function viewFavDemand(item) {
  const id = item.demand_id || item.id
  router.push(`/merchant/demands/${id}`)
}

// 监听切换到收藏tab时加载
watch(infoTab, (newTab) => {
  if (newTab === 'favorites') {
    loadFavorites()
  }
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
.img-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
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
.favorites-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.fav-card { cursor: pointer; transition: transform 0.2s; }
.fav-card:hover { transform: translateY(-2px); }
.fav-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.fav-info { flex: 1; min-width: 0; }
.fav-title { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.fav-community { font-size: 12px; color: #409EFF; }
.fav-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.fav-score { display: flex; align-items: center; gap: 2px; }
.score-label { font-size: 11px; color: #606266; font-weight: 500; margin-right: 2px; }
.heart { color: #ddd; font-size: 12px; }
.heart.filled { color: #f56c6c; }
.fav-star { font-size: 18px; color: #f56c6c; }
.fav-star.active { color: #f56c6c; }
.password-form { padding: 10px 0; }
.fav-desc { font-size: 13px; color: #606266; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.upload-placeholder { width: 80px; height: 80px; border: 1px dashed #dcdfe6; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #909399; cursor: pointer; font-size: 12px; gap: 4px; transition: border-color 0.2s; }
.upload-placeholder:hover { border-color: #409EFF; color: #409EFF; }

/* 产品/服务编辑样式 */
.products-editor { display: flex; flex-direction: column; gap: 16px; }
.product-item { background: #f5f7fa; border-radius: 8px; padding: 16px; }
.product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.product-num { font-weight: 600; color: #303133; }
.product-body { display: flex; flex-direction: column; gap: 8px; }
.product-image-upload { width: 120px; }
.product-image-placeholder { width: 120px; height: 80px; border: 1px dashed #dcdfe6; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #909399; cursor: pointer; font-size: 12px; gap: 4px; }
.product-image-placeholder:hover { border-color: #409EFF; color: #409EFF; }
.product-image-preview { width: 120px; height: 80px; border-radius: 6px; overflow: hidden; position: relative; cursor: pointer; }
.product-image-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; opacity: 0; transition: opacity 0.2s; }
.product-image-preview:hover .product-image-mask { opacity: 1; }

/* 产品列表展示样式 */
.products-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.product-card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; transition: box-shadow 0.2s; }
.product-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.product-card-image { width: 100%; }
.product-card-content { padding: 12px; }
.product-card-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 8px; }
.product-card-desc { font-size: 13px; color: #606266; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

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
