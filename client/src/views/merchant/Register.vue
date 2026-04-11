<template>
  <div class="register-page">
    <!-- 功能介绍区域 -->
    <div class="feature-intro" v-if="registerType === 'merchant'">
      <h1>邻盟 · 商家资源精准触达平台</h1>
      <p class="tagline">发布资源，精准匹配，高效合作</p>
      <div class="features">
        <div class="feature-item">
          <el-icon><Goods /></el-icon>
          <span>资源曝光</span>
          <small>面向武汉300+社区展示</small>
        </div>
        <div class="feature-item">
          <el-icon><Connection /></el-icon>
          <span>精准匹配</span>
          <small>AI推荐最适合的社区需求</small>
        </div>
        <div class="feature-item">
          <el-icon><Medal /></el-icon>
          <span>会员权益</span>
          <small>多等级权益，差异化服务</small>
        </div>
        <div class="feature-item">
          <el-icon><Trophy /></el-icon>
          <span>品牌合作</span>
          <small>提升在社区的影响力</small>
        </div>
      </div>
    </div>

    <div class="register-container">
      <div class="register-header">
        <el-icon :size="40" color="#67C23A"><Shop /></el-icon>
        <h2>{{ registerType === 'expert' ? '商家/专家注册' : '商家/专家注册' }}</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <!-- 注册类型选择 -->
      <div class="type-selector" v-if="!registerType">
        <div class="type-option" @click="registerType = 'merchant'">
          <el-icon :size="48" color="#67C23A"><Shop /></el-icon>
          <h3>商家注册</h3>
          <p>企业/商户入驻，发布资源，对接社区需求</p>
        </div>
        <div class="type-option" @click="registerType = 'expert'">
          <el-icon :size="48" color="#409EFF"><UserFilled /></el-icon>
          <h3>专家注册</h3>
          <p>个人专业服务，无需营业执照</p>
        </div>
      </div>

      <!-- ===== 商家注册：分步表单 ===== -->
      <div v-if="registerType === 'merchant'">
        <!-- 步骤指示器 -->
        <div class="step-bar">
          <div :class="['step-item', { active: merchantStep >= 1, done: merchantStep > 1 }]">
            <div class="step-num">{{ merchantStep > 1 ? '✓' : '1' }}</div>
            <span>基本信息</span>
          </div>
          <div class="step-line" :class="{ active: merchantStep > 1 }"></div>
          <div :class="['step-item', { active: merchantStep >= 2 }]">
            <div class="step-num">2</div>
            <span>完善资料</span>
          </div>
        </div>

        <!-- 第一步：商家名称、行业分类、联系人、手机号、验证码 -->
        <el-form v-show="merchantStep === 1" :model="form" :rules="merchantStep1Rules" ref="merchantStep1Ref" class="register-form" label-position="top">
          <el-form-item label="商家/企业名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入商家/企业名称" size="large" :prefix-icon="Shop" />
          </el-form-item>
          <el-form-item label="行业分类" prop="category">
            <el-select v-model="form.category" placeholder="请选择行业分类" size="large" style="width: 100%" :loading="loadingIndustries">
              <el-option v-for="ind in industries" :key="ind" :label="ind" :value="ind" />
            </el-select>
          </el-form-item>
          <el-form-item label="联系人姓名" prop="contact">
            <el-input v-model="form.contact" placeholder="请输入联系人姓名（将作为登录名）" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" size="large" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-input">
              <el-input v-model="form.code" placeholder="请输入验证码" size="large" :prefix-icon="Key" />
              <el-button type="success" size="large" :disabled="counting" @click="sendMerchantCode">
                {{ counting ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="登录密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="设置登录密码（6-20位）" size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item label="推荐人">
            <el-input v-model="form.referrer" placeholder="使用渠道码注册时自动填入（选填）" size="large" :prefix-icon="UserFilled" disabled />
          </el-form-item>
          <el-form-item>
            <el-button type="success" size="large" class="register-btn" @click="goMerchantStep2">
              下一步
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 第二步：企业规模、企业地址、营业执照、Logo、企业简介 -->
        <el-form v-show="merchantStep === 2" :model="form" ref="merchantStep2Ref" class="register-form" label-position="top">
          <el-form-item label="企业规模">
            <el-select v-model="form.scale" placeholder="请选择企业规模" size="large" style="width: 100%">
              <el-option label="1-10人" value="1-10人" />
              <el-option label="11-50人" value="11-50人" />
              <el-option label="51-100人" value="51-100人" />
              <el-option label="101-500人" value="101-500人" />
              <el-option label="500人以上" value="500人以上" />
            </el-select>
          </el-form-item>

          <el-form-item label="企业地址">
            <el-input v-model="form.address" placeholder="请输入企业详细地址（选填）" size="large" />
          </el-form-item>

          <el-form-item label="营业执照">
            <div class="upload-area">
              <el-upload
                v-model:file-list="form.licenseList"
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                list-type="picture-card"
                :on-change="(f) => handleMerchantFileChange(f, 'license')"
                :on-remove="() => { form.license = '' }"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">上传营业执照照片，用于审核认证（选填）</div>
            </div>
          </el-form-item>

          <el-form-item label="企业Logo">
            <div class="upload-area">
              <el-upload
                v-model:file-list="form.logoList"
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                list-type="picture-card"
                :on-change="(f) => handleMerchantFileChange(f, 'logo')"
                :on-remove="() => { form.logo = '' }"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">上传企业Logo，展示在平台页面（选填）</div>
            </div>
          </el-form-item>

          <el-form-item label="企业简介">
            <el-input
              v-model="form.intro"
              type="textarea"
              :rows="3"
              placeholder="请简要介绍您的企业（选填）"
              size="large"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="form.agree">
              我已阅读并同意
              <el-link type="success" @click.prevent="$router.push('/legal/terms')">《邻盟平台服务协议》</el-link>
              和
              <el-link type="success" @click.prevent="$router.push('/legal/privacy')">《隐私政策》</el-link>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <div class="step-actions">
              <el-button size="large" @click="merchantStep = 1">上一步</el-button>
              <el-button type="success" size="large" class="register-btn" :disabled="!form.agree" @click="register">
                立即注册
              </el-button>
            </div>
          </el-form-item>

          <el-form-item style="text-align: center; margin-top: -10px;">
            <el-link type="info" @click="skipStep2">跳过此步，稍后补充 →</el-link>
          </el-form-item>
        </el-form>
      </div>

      <!-- ===== 专家注册：分步表单 ===== -->
      <div v-if="registerType === 'expert'">
        <!-- 步骤指示器 -->
        <div class="step-bar">
          <div :class="['step-item', { active: expertStep >= 1, done: expertStep > 1 }]">
            <div class="step-num">{{ expertStep > 1 ? '✓' : '1' }}</div>
            <span>基本信息</span>
          </div>
          <div class="step-line" :class="{ active: expertStep > 1 }"></div>
          <div :class="['step-item', { active: expertStep >= 2 }]">
            <div class="step-num">2</div>
            <span>完善资料</span>
          </div>
        </div>

        <!-- 第一步：姓名、类型、手机号、验证码 -->
        <el-form v-show="expertStep === 1" :model="expertForm" :rules="expertStep1Rules" ref="expertStep1Ref" class="register-form" label-position="top">
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="expertForm.realName" placeholder="请输入真实姓名（将作为登录名）" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="专家类型" prop="expertType">
            <el-select v-model="expertForm.expertType" placeholder="请选择专家类型" size="large" style="width: 100%" :loading="loadingExpertTypes">
              <el-option v-for="t in expertTypes" :key="t.name" :label="t.name" :value="t.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="expertForm.phone" placeholder="请输入手机号" size="large" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-input">
              <el-input v-model="expertForm.code" placeholder="请输入验证码" size="large" :prefix-icon="Key" />
              <el-button type="primary" size="large" :disabled="expertCounting" @click="sendExpertCode">
                {{ expertCounting ? `${expertCountdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="登录密码" prop="password">
            <el-input v-model="expertForm.password" type="password" placeholder="设置登录密码（6-20位）" size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="expertForm.confirmPassword" type="password" placeholder="再次输入密码" size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="register-btn" @click="goStep2">
              下一步
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 第二步：照片、简介、社会身份、荣誉、标签 -->
        <el-form v-show="expertStep === 2" :model="expertForm" ref="expertStep2Ref" class="register-form" label-position="top">
          <el-form-item label="个人照片">
            <div class="upload-area">
              <el-upload
                v-model:file-list="expertForm.personalPhotoList"
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                list-type="picture-card"
                :on-change="(f) => handlePhotoChange(f, 'personal')"
                :on-remove="() => { expertForm.personalPhoto = '' }"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">建议上传清晰正面照，展示在个人主页</div>
            </div>
          </el-form-item>

          <el-form-item label="身份证照片">
            <div class="upload-area">
              <el-upload
                v-model:file-list="expertForm.idCardPhotoList"
                :auto-upload="false"
                :limit="1"
                accept="image/*"
                list-type="picture-card"
                :on-change="(f) => handlePhotoChange(f, 'idcard')"
                :on-remove="() => { expertForm.idCardPhoto = '' }"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">仅用于身份验证，平台严格保密</div>
            </div>
          </el-form-item>

          <el-form-item label="个人简介">
            <el-input
              v-model="expertForm.intro"
              type="textarea"
              :rows="3"
              placeholder="请简要介绍您的专业背景和服务方向（选填）"
              size="large"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="社会身份">
            <el-input
              v-model="expertForm.socialIdentity"
              placeholder="如：社区志愿者协会会长、退休教师等（选填）"
              size="large"
              maxlength="100"
            />
          </el-form-item>

          <el-form-item label="荣誉资质">
            <el-input
              v-model="expertForm.honors"
              type="textarea"
              :rows="2"
              placeholder="如：市级优秀志愿者、XX资格证书等（选填，多项用逗号分隔）"
              size="large"
              maxlength="300"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="服务标签">
            <div class="tag-selector">
              <el-checkbox-group v-model="expertForm.tags">
                <el-checkbox
                  v-for="tag in defaultTags"
                  :key="tag"
                  :label="tag"
                  border
                  size="small"
                  style="margin: 4px"
                />
              </el-checkbox-group>
            </div>
            <div class="upload-tip">选择符合您专长的标签，便于社区精准匹配</div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="expertForm.agree">
              我已阅读并同意
              <el-link type="primary" @click.prevent="$router.push('/legal/terms')">《邻盟平台服务协议》</el-link>
              和
              <el-link type="primary" @click.prevent="$router.push('/legal/privacy')">《隐私政策》</el-link>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <div class="step-actions">
              <el-button size="large" @click="expertStep = 1">上一步</el-button>
              <el-button type="primary" size="large" class="register-btn" :disabled="!expertForm.agree || submitting" :loading="submitting" @click="registerExpert">
                立即注册
              </el-button>
            </div>
          </el-form-item>

          <el-form-item style="text-align: center; margin-top: -10px;">
            <el-link type="info" @click="skipExpertStep2">跳过此步，稍后补充 →</el-link>
          </el-form-item>
        </el-form>
      </div>

      <div class="register-footer">
        <el-link v-if="registerType" @click="registerType = ''">← 重新选择注册类型</el-link>
        <el-link v-if="!registerType" @click="$router.push('/login/merchant')">← 已有账号？立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, User, Shop, Goods, Connection, Medal, Trophy, UserFilled, Lock, Plus } from '@element-plus/icons-vue'
import { getIndustries, sendSms, uploadImage, checkPhone } from '@/api/public'
import { expertRegister, merchantRegister } from '@/api/merchant'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const expertStep1Ref = ref(null)
const expertStep2Ref = ref(null)
const industries = ref([])
const loadingIndustries = ref(false)
const expertTypes = ref([])
const loadingExpertTypes = ref(false)
const defaultTags = ref([])
const registerType = ref('')

// 商家注册表单
const merchantStep = ref(1)
const merchantStep1Ref = ref(null)
const form = reactive({
  name: '', category: '', contact: '', phone: '', code: '',
  password: '', confirmPassword: '',
  agree: false,
  scale: '', address: '', license: '', licenseList: [], logo: '', logoList: [], intro: '',
  referrer: '' // 推荐人（渠道码对应的大使姓名）
})
const merchantStep1Rules = {
  name: [{ required: true, message: '请输入商家/企业名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择行业分类', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: (rule, value, cb) => {
    if (!value) return cb(new Error('请再次输入密码'))
    if (value !== form.password) return cb(new Error('两次密码不一致'))
    cb()
  }, trigger: 'blur' }]
}

// 专家注册分步
const expertStep = ref(1)
const submitting = ref(false)

const expertForm = reactive({
  realName: '',
  expertType: '',
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',
  personalPhoto: '',
  personalPhotoList: [],
  idCardPhoto: '',
  idCardPhotoList: [],
  intro: '',
  socialIdentity: '',
  honors: '',
  tags: [],
  agree: false
})

const expertStep1Rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  expertType: [{ required: true, message: '请选择专家类型', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: (rule, value, cb) => {
    if (!value) return cb(new Error('请再次输入密码'))
    if (value !== expertForm.password) return cb(new Error('两次密码不一致'))
    cb()
  }, trigger: 'blur' }]
}

// 商家验证码倒计时
const counting = ref(false)
const countdown = ref(60)

// 商家图片上传处理
async function handleMerchantFileChange(file, type) {
  if (!file.raw) return
  try {
    const res = await uploadImage(file.raw)
    const url = res.data?.url || res.data
    if (type === 'license') {
      form.license = url
    } else {
      form.logo = url
    }
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
    if (type === 'license') form.licenseList = []
    else form.logoList = []
  }
}

// 商家注册：第一步验证 → 进入第二步
function goMerchantStep2() {
  merchantStep1Ref.value.validate((valid) => {
    if (!valid) return
    merchantStep.value = 2
  })
}

// 跳过第二步，直接注册
function skipStep2() {
  if (!form.agree) {
    ElMessage.warning('请先阅读并同意服务协议')
    return
  }
  register(true)
}

// 专家验证码倒计时
const expertCounting = ref(false)
const expertCountdown = ref(60)

// 图片上传处理（先上传到服务器，获取URL）
async function handlePhotoChange(file, type) {
  if (!file.raw) return
  try {
    const res = await uploadImage(file.raw)
    const url = res.data?.url || res.data
    if (type === 'personal') {
      expertForm.personalPhoto = url
    } else {
      expertForm.idCardPhoto = url
    }
    ElMessage.success('照片上传成功')
  } catch {
    ElMessage.error('照片上传失败')
    // 移除失败的文件
    if (type === 'personal') expertForm.personalPhotoList = []
    else expertForm.idCardPhotoList = []
  }
}

// 加载行业分类（商家用）
async function loadIndustries() {
  loadingIndustries.value = true
  try {
    const res = await getIndustries()
    industries.value = res.data || []
  } catch {
    industries.value = []
  } finally {
    loadingIndustries.value = false
  }
}

// 加载专家类型列表
async function loadExpertTypesList() {
  loadingExpertTypes.value = true
  try {
    const { getExpertTypes } = await import('@/api/merchant')
    const resp = await getExpertTypes()
    console.log('Register - Expert types API response:', resp.data)
    if (resp.data && Array.isArray(resp.data)) {
      expertTypes.value = resp.data
        .filter(t => t.status === 1 || t.status === '1' || t.status === undefined)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    } else {
      expertTypes.value = []
    }
    console.log('Register - Loaded expert types:', expertTypes.value)
  } catch (err) {
    console.error('Register - Load expert types failed:', err)
    expertTypes.value = []
  } finally {
    loadingExpertTypes.value = false
  }
}

// 加载默认标签
async function loadDefaultTags() {
  try {
    const { request: req } = await import('@/utils/request')
    const resp = await req.get('/public/tags', { params: { type: 2 } })
    defaultTags.value = (resp.data || []).filter(t => t.status === 1).map(t => t.name).filter(Boolean)
    if (defaultTags.value.length === 0) {
      // 降级：从 publish-types 获取 merchant_tags
      const resp2 = await req.get('/public/publish-types')
      const tags = resp2.data?.merchant_tags
      if (Array.isArray(tags)) {
        defaultTags.value = tags.map(t => typeof t === 'string' ? t : t.name || t.label).filter(Boolean)
      }
    }
    if (defaultTags.value.length === 0) {
      defaultTags.value = ['连锁品牌', '本地企业', '高端品牌', '大众品牌', '公益导向', '长期合作', '亲子品牌', '老年服务', '全国服务', '精准获客', '社会责任']
    }
  } catch {
    defaultTags.value = ['公益导向', '长期合作', '亲子服务', '老年服务', '社区服务', '志愿服务', '专业认证', '技能培训']
  }
}

// 商家验证码
async function sendMerchantCode() {
  if (!form.phone) { ElMessage.warning('请先输入手机号'); return }
  if (counting.value) return
  try {
    // 检查手机号是否已注册（商家或专家）
    const checkRes = await checkPhone({ phone: form.phone, role: 'merchant' })
    if (checkRes.data?.exists) {
      const existingType = checkRes.data?.existingType
      const msg = existingType === 'expert' 
        ? '该手机号已注册为专家，请使用其他手机号或前往专家登录' 
        : '该手机号已注册为商家，请使用其他手机号或前往登录'
      ElMessage.warning(msg)
      return
    }
    const res = await sendSms({ phone: form.phone, type: 'register' })
    // 测试版：自动填入验证码
    if (res.data?.code) form.code = res.data.code
    ElMessage.success('验证码已发送')
    counting.value = true; countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) { clearInterval(timer); counting.value = false }
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '发送验证码失败')
  }
}

// 专家验证码
async function sendExpertCode() {
  if (!expertForm.phone) { ElMessage.warning('请先输入手机号'); return }
  if (expertCounting.value) return
  try {
    // 检查手机号是否已注册（商家或专家）
    const checkRes = await checkPhone({ phone: expertForm.phone, role: 'expert' })
    if (checkRes.data?.exists) {
      const existingType = checkRes.data?.existingType
      const msg = existingType === 'expert' 
        ? '该手机号已注册为专家，请使用其他手机号或前往专家登录' 
        : '该手机号已注册为商家，请使用其他手机号或前往商家登录'
      ElMessage.warning(msg)
      return
    }
    const res = await sendSms({ phone: expertForm.phone, type: 'register' })
    // 测试版：自动填入验证码
    if (res.data?.code) expertForm.code = res.data.code
    ElMessage.success('验证码已发送')
    expertCounting.value = true; expertCountdown.value = 60
    const timer = setInterval(() => {
      expertCountdown.value--
      if (expertCountdown.value <= 0) { clearInterval(timer); expertCounting.value = false }
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '发送验证码失败')
  }
}

// 商家注册
const register = async (skipped = false) => {
  if (!form.agree) { ElMessage.warning('请先阅读并同意服务协议'); return }
  try {
    await merchantRegister({
      username: form.contact,  // 联系人姓名作为登录名
      password: form.password,
      company_name: form.name,
      industry: form.category,
      contact_name: form.contact,
      phone: form.phone,
      address: form.address || '',
      scale: form.scale || '',
      business_license: form.license || '',
      logo: form.logo || '',
      description: form.intro || '',
      company_type: 'merchant',
      referrer: form.referrer || ''
    })
    const msg = skipped ? '注册成功！请登录后尽快完善企业资料' : '注册成功！即将跳转到登录页面...'
    ElMessage.success(msg)
    setTimeout(() => { router.push('/login/merchant') }, 1500)
  } catch (e) {
    ElMessage.error(e.message || '注册失败，请稍后重试')
  }
}

// 专家注册：第一步验证 → 进入第二步
function goStep2() {
  expertStep1Ref.value.validate((valid) => {
    if (!valid) return
    expertStep.value = 2
  })
}

// 专家注册：跳过第二步
function skipExpertStep2() {
  if (!expertForm.agree) {
    ElMessage.warning('请先阅读并同意服务协议')
    return
  }
  registerExpert(true)
}

// 专家注册：提交
async function registerExpert(skipped = false) {
  if (!expertForm.agree) { ElMessage.warning('请先阅读并同意服务协议'); return }
  submitting.value = true
  try {
    await expertRegister({
      username: expertForm.realName,  // 姓名作为登录名
      password: expertForm.password,
      realName: expertForm.realName,
      expertType: expertForm.expertType,
      phone: expertForm.phone,
      code: expertForm.code,
      personalPhoto: expertForm.personalPhoto,
      idCardPhoto: expertForm.idCardPhoto,
      intro: expertForm.intro,
      socialIdentity: expertForm.socialIdentity,
      honors: expertForm.honors,
      tags: expertForm.tags,
      skipped: skipped // 标记是否跳过了第二步
    })
    const msg = skipped ? '注册成功！请登录后尽快完善专家资料' : '专家注册成功，请等待审核'
    ElMessage.success(msg)
    setTimeout(() => { router.push('/login/merchant') }, 1500)
  } catch (e) {
    ElMessage.error(e.message || '专家注册失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadIndustries()
  loadExpertTypesList()
  loadDefaultTags()
  // 检查渠道码参数，自动填入推荐人
  const code = route.query.code
  if (code) {
    fetchAmbassadorByCode(code)
  }
})

// 根据渠道码获取大使信息
async function fetchAmbassadorByCode(code) {
  try {
    const { request: req } = await import('@/utils/request')
    const resp = await req.get('/public/ambassador/by-code', { params: { code } })
    if (resp.data && resp.data.real_name) {
      form.referrer = resp.data.real_name
    }
  } catch (e) {
    console.error('获取推荐人失败:', e)
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.register-header h2 { margin: 15px 0 5px; color: #303133; }
.register-header p { color: #909399; font-size: 14px; }

.register-form { margin-bottom: 20px; }

.type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.type-option {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover {
  border-color: #409EFF;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.type-option h3 { margin: 12px 0 6px; font-size: 16px; color: #303133; }
.type-option p { font-size: 12px; color: #909399; line-height: 1.5; }

/* 分步指示器 */
.step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  gap: 0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}

.step-item.active { color: #409EFF; }
.step-item.done { color: #67C23A; }

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #f0f2f5;
  color: #909399;
  flex-shrink: 0;
}

.step-item.active .step-num { background: #409EFF; color: white; }
.step-item.done .step-num { background: #67C23A; color: white; }

.step-line {
  width: 60px;
  height: 2px;
  background: #e4e7ed;
  margin: 0 12px;
  transition: background 0.3s;
}

.step-line.active { background: #409EFF; }

.code-input {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input .el-input { flex: 1; }

.register-btn { width: 100%; }

.step-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.step-actions .register-btn { flex: 1; }

.register-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.upload-area { width: 100%; }

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.tag-selector {
  width: 100%;
}

.tag-selector :deep(.el-checkbox) {
  margin-right: 0;
}

@media (max-width: 768px) {
  .register-container {
    padding: 24px 16px;
    border-radius: 12px;
  }
  .register-header { margin-bottom: 20px; }
  .register-header h2 { font-size: 20px; margin: 10px 0 5px; }
  .register-header p { font-size: 12px; }
  .code-input :deep(.el-input) { width: 55%; }
  .code-input .el-button { flex: 1; min-width: 0; }
  .register-footer { text-align: center; }
  .type-selector { gap: 12px; }
  .type-option { padding: 16px 12px; }
  .type-option h3 { font-size: 15px; }
}

@media (max-width: 480px) {
  .register-container {
    padding: 20px 14px;
    margin: 10px 0;
  }
  .register-page {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
}

/* 功能介绍样式 */
.feature-intro {
  position: fixed;
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  max-width: 400px;
  padding-right: 60px;
}

.feature-intro h1 { font-size: 32px; margin-bottom: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.feature-intro .tagline { font-size: 18px; opacity: 0.95; margin-bottom: 32px; }
.feature-intro .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.feature-item { display: flex; flex-direction: column; gap: 6px; }
.feature-item .el-icon { font-size: 28px; margin-bottom: 4px; }
.feature-item span { font-weight: 600; font-size: 16px; }
.feature-item small { font-size: 13px; opacity: 0.85; }

@media (max-width: 1100px) {
  .feature-intro {
    position: static; transform: none; max-width: 100%;
    padding: 20px 16px; margin-bottom: 0; text-align: center;
  }
  .feature-intro h1 { font-size: 24px; }
  .feature-intro .tagline { font-size: 14px; margin-bottom: 20px; }
  .feature-intro .features {
    grid-template-columns: repeat(2, 1fr); gap: 12px;
    max-width: 400px; margin: 0 auto;
  }
  .feature-item { align-items: center; }
  .feature-item .el-icon { font-size: 24px; }
  .feature-item span { font-size: 14px; }
  .feature-item small { font-size: 11px; }
  .register-page {
    flex-direction: column; align-items: center;
    justify-content: flex-start; padding-top: 20px;
  }
  .register-container {
    max-width: 520px; width: 100%; border-radius: 16px;
    margin: 0 16px; padding: 24px;
  }
  .register-header { margin-bottom: 20px; }
  .register-header h2 { font-size: 20px; margin: 10px 0 5px; }
  .register-header p { font-size: 12px; }
  .register-form :deep(.el-form-item) { margin-bottom: 16px; }
  .code-input :deep(.el-input) { width: 55%; }
  .code-input .el-button { flex: 1; min-width: 0; }
  .register-footer { text-align: center; padding-top: 16px; }
}

@media (max-width: 768px) {
  .feature-intro { padding: 16px 14px; }
  .feature-intro h1 { font-size: 20px; }
  .feature-intro .features { gap: 8px; }
  .feature-item .el-icon { font-size: 22px; }
  .feature-item span { font-size: 13px; }
  .feature-item small { font-size: 10px; }
  .register-container { padding: 20px 14px; border-radius: 12px; margin: 0 10px; }
  .register-form :deep(.el-form-item) { margin-bottom: 14px; }
}
</style>
