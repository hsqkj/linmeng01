<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <el-icon :size="40" color="#409EFF"><House /></el-icon>
        <h2>社区工作者注册</h2>
        <p>邻盟 - 社区资源智能匹配助手</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
        <el-form-item prop="district">
          <el-select v-model="form.district" placeholder="请选择所在区/开发区" size="large" style="width:100%" @change="onDistrictChange">
            <el-option v-for="d in districts" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>

        <el-form-item prop="street">
          <el-select v-model="form.street" placeholder="请选择街道/镇" size="large" style="width:100%" :disabled="!form.district" @change="onStreetChange">
            <el-option v-for="s in filteredStreets" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>

        <el-form-item prop="community">
          <el-select v-model="form.community" placeholder="请选择社区" size="large" style="width:100%" :disabled="!form.street">
            <el-option v-for="c in filteredCommunities" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>

        <el-form-item prop="manager">
          <el-input
            v-model="form.manager"
            placeholder="请输入负责人姓名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            size="large"
            :prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item prop="code">
          <div class="code-input">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              size="large"
              :prefix-icon="Key"
            />
            <el-button
              type="primary"
              size="large"
              :disabled="counting"
              @click="sendCode"
            >
              {{ counting ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.agree">
            我已阅读并同意
            <el-link type="primary" @click.prevent="$router.push('/legal/terms')">《邻盟平台服务协议》</el-link>
            和
            <el-link type="primary" @click.prevent="$router.push('/legal/privacy')">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :disabled="!form.agree"
            @click="register"
          >
            立即注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <el-link @click="$router.push('/login/community')">← 已有账号？立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Key, User, OfficeBuilding, Location } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)

const form = reactive({
  district: '',
  street: '',
  community: '',
  manager: '',
  phone: '',
  code: '',
  agree: false
})

const rules = {
  district: [{ required: true, message: '请选择所在区', trigger: 'change' }],
  street: [{ required: true, message: '请选择街道/镇', trigger: 'change' }],
  community: [{ required: true, message: '请选择社区', trigger: 'change' }],
  manager: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const districts = ['东湖新技术开发区', '武昌区', '江汉区', '硚口区', '汉阳区', '青山区', '洪山区', '东西湖区', '蔡甸区', '江夏区', '黄陂区', '新洲区']

const streetOptions = {
  '东湖新技术开发区': [
    { label: '关东街道', value: '关东街道' },
    { label: '佛祖岭街道', value: '佛祖岭街道' },
    { label: '豹澥街道', value: '豹澥街道' },
    { label: '九峰街道', value: '九峰街道' },
    { label: '左岭街道', value: '左岭街道' },
    { label: '龙泉街道', value: '龙泉街道' },
    { label: '滨湖街道', value: '滨湖街道' }
  ],
  '武昌区': [
    { label: '积玉桥街道', value: '积玉桥街道' },
    { label: '粮道街街道', value: '粮道街街道' },
    { label: '中华路街道', value: '中华路街道' },
    { label: '黄鹤楼街道', value: '黄鹤楼街道' },
    { label: '紫阳街道', value: '紫阳街道' }
  ],
  '江汉区': [
    { label: '民族街道', value: '民族街道' },
    { label: '花楼街道', value: '花楼街道' },
    { label: '满春街道', value: '满春街道' },
    { label: '民意街道', value: '民意街道' },
    { label: '新华街道', value: '新华街道' }
  ],
  '硚口区': [
    { label: '古田街道', value: '古田街道' },
    { label: '韩家墩街道', value: '韩家墩街道' },
    { label: '宗关街道', value: '宗关街道' },
    { label: '汉水桥街道', value: '汉水桥街道' },
    { label: '宝丰街道', value: '宝丰街道' }
  ],
  '汉阳区': [
    { label: '建桥街道', value: '建桥街道' },
    { label: '晴川街道', value: '晴川街道' },
    { label: '鹦鹉街道', value: '鹦鹉街道' },
    { label: '洲头街道', value: '洲头街道' },
    { label: '五里墩街道', value: '五里墩街道' }
  ],
  '青山区': [
    { label: '红钢城街道', value: '红钢城街道' },
    { label: '新沟桥街道', value: '新沟桥街道' },
    { label: '红卫路街道', value: '红卫路街道' },
    { label: '冶金街道', value: '冶金街道' },
    { label: '白玉山街道', value: '白玉山街道' }
  ],
  '洪山区': [
    { label: '珞南街道', value: '珞南街道' },
    { label: '关山街道', value: '关山街道' },
    { label: '狮子山街道', value: '狮子山街道' },
    { label: '张家湾街道', value: '张家湾街道' },
    { label: '梨园街道', value: '梨园街道' }
  ],
  '东西湖区': [
    { label: '吴家山街道', value: '吴家山街道' },
    { label: '长青街道', value: '长青街道' },
    { label: '慈惠街道', value: '慈惠街道' },
    { label: '走马岭街道', value: '走马岭街道' },
    { label: '径河街道', value: '径河街道' }
  ],
  '蔡甸区': [
    { label: '蔡甸街道', value: '蔡甸街道' },
    { label: '奓山街道', value: '奓山街道' },
    { label: '永安街道', value: '永安街道' },
    { label: '侏儒山街道', value: '侏儒山街道' },
    { label: '大集街道', value: '大集街道' }
  ],
  '江夏区': [
    { label: '纸坊街道', value: '纸坊街道' },
    { label: '金口街道', value: '金口街道' },
    { label: '乌龙泉街道', value: '乌龙泉街道' },
    { label: '郑店街道', value: '郑店街道' },
    { label: '五里界街道', value: '五里界街道' }
  ],
  '黄陂区': [
    { label: '前川街道', value: '前川街道' },
    { label: '横店街道', value: '横店街道' },
    { label: '罗汉寺街道', value: '罗汉寺街道' },
    { label: '滠口街道', value: '滠口街道' },
    { label: '祁家湾街道', value: '祁家湾街道' }
  ],
  '新洲区': [
    { label: '邾城街道', value: '邾城街道' },
    { label: '阳逻街道', value: '阳逻街道' },
    { label: '仓埠街道', value: '仓埠街道' },
    { label: '汪集街道', value: '汪集街道' },
    { label: '李集街道', value: '李集街道' }
  ]
}

// 社区选项（第三级）
const communityOptions = {
  '关东街道': [
    { label: '光谷社区', value: '光谷社区' },
    { label: '关南社区', value: '关南社区' },
    { label: '关西社区', value: '关西社区' },
    { label: '曙光社区', value: '曙光社区' }
  ],
  '佛祖岭街道': [
    { label: '佛祖岭社区', value: '佛祖岭社区' },
    { label: '凤凰社区', value: '凤凰社区' },
    { label: '顺溜社区', value: '顺溜社区' }
  ],
  '豹澥街道': [
    { label: '豹澥社区', value: '豹澥社区' },
    { label: '同心社区', value: '同心社区' }
  ],
  '九峰街道': [
    { label: '九峰社区', value: '九峰社区' },
    { label: '景源社区', value: '景源社区' }
  ],
  '左岭街道': [
    { label: '左岭社区', value: '左岭社区' },
    { label: '星芯社区', value: '星芯社区' }
  ],
  '龙泉街道': [
    { label: '龙泉社区', value: '龙泉社区' },
    { label: '升华社区', value: '升华社区' }
  ],
  '滨湖街道': [
    { label: '滨湖社区', value: '滨湖社区' },
    { label: '碧水社区', value: '碧水社区' }
  ],
  '积玉桥街道': [
    { label: '积玉桥社区', value: '积玉桥社区' },
    { label: '金都蓝湾社区', value: '金都蓝湾社区' }
  ],
  '粮道街街道': [
    { label: '粮道街社区', value: '粮道街社区' },
    { label: '昙华林社区', value: '昙华林社区' }
  ],
  '中华路街道': [
    { label: '中华路社区', value: '中华路社区' },
    { label: '户部巷社区', value: '户部巷社区' }
  ],
  '黄鹤楼街道': [
    { label: '黄鹤楼社区', value: '黄鹤楼社区' },
    { label: '读书社区', value: '读书社区' }
  ],
  '紫阳街道': [
    { label: '紫阳社区', value: '紫阳社区' },
    { label: '复兴社区', value: '复兴社区' }
  ],
  '民族街道': [
    { label: '民族社区', value: '民族社区' },
    { label: '龙王庙社区', value: '龙王庙社区' }
  ],
  '花楼街道': [
    { label: '花楼社区', value: '花楼社区' },
    { label: '水塔社区', value: '水塔社区' }
  ],
  '满春街道': [
    { label: '满春社区', value: '满春社区' },
    { label: '中大社区', value: '中大社区' }
  ],
  '民意街道': [
    { label: '民意社区', value: '民意社区' },
    { label: '天后社区', value: '天后社区' }
  ],
  '新华街道': [
    { label: '新华社区', value: '新华社区' },
    { label: '取水楼社区', value: '取水楼社区' }
  ],
  '古田街道': [
    { label: '古田社区', value: '古田社区' },
    { label: '罗家墩社区', value: '罗家墩社区' }
  ],
  '韩家墩街道': [
    { label: '韩家墩社区', value: '韩家墩社区' },
    { label: '曾家社区', value: '曾家社区' }
  ],
  '宗关街道': [
    { label: '宗关社区', value: '宗关社区' },
    { label: '发展社区', value: '发展社区' }
  ],
  '汉水桥街道': [
    { label: '汉水桥社区', value: '汉水桥社区' },
    { label: '营房社区', value: '营房社区' }
  ],
  '宝丰街道': [
    { label: '宝丰社区', value: '宝丰社区' },
    { label: '站邻社区', value: '站邻社区' }
  ],
  '建桥街道': [
    { label: '建桥社区', value: '建桥社区' },
    { label: '凤楼社区', value: '凤楼社区' }
  ],
  '晴川街道': [
    { label: '晴川社区', value: '晴川社区' },
    { label: '汉汽社区', value: '汉汽社区' }
  ],
  '鹦鹉街道': [
    { label: '鹦鹉社区', value: '鹦鹉社区' },
    { label: '自力社区', value: '自力社区' }
  ],
  '洲头街道': [
    { label: '洲头社区', value: '洲头社区' },
    { label: '新五里社区', value: '新五里社区' }
  ],
  '五里墩街道': [
    { label: '五里墩社区', value: '五里墩社区' },
    { label: '墨水湖社区', value: '墨水湖社区' }
  ],
  '红钢城街道': [
    { label: '红钢城社区', value: '红钢城社区' },
    { label: '和悦社区', value: '和悦社区' }
  ],
  '新沟桥街道': [
    { label: '新沟桥社区', value: '新沟桥社区' },
    { label: '蒋家墩社区', value: '蒋家墩社区' }
  ],
  '红卫路街道': [
    { label: '红卫路社区', value: '红卫路社区' },
    { label: '科大社区', value: '科大社区' }
  ],
  '冶金街道': [
    { label: '冶金社区', value: '冶金社区' },
    { label: '名流社区', value: '名流社区' }
  ],
  '白玉山街道': [
    { label: '白玉山社区', value: '白玉山社区' },
    { label: '康宁社区', value: '康宁社区' }
  ],
  '珞南街道': [
    { label: '珞南社区', value: '珞南社区' },
    { label: '理工大社区', value: '理工大社区' }
  ],
  '关山街道': [
    { label: '关山社区', value: '关山社区' },
    { label: '逸景华庭社区', value: '逸景华庭社区' }
  ],
  '狮子山街道': [
    { label: '狮子山社区', value: '狮子山社区' },
    { label: '华农西社区', value: '华农西社区' }
  ],
  '张家湾街道': [
    { label: '张家湾社区', value: '张家湾社区' },
    { label: '长征社区', value: '长征社区' }
  ],
  '梨园街道': [
    { label: '梨园社区', value: '梨园社区' },
    { label: '东湖社区', value: '东湖社区' }
  ],
  '吴家山街道': [
    { label: '吴家山社区', value: '吴家山社区' },
    { label: '祁家山社区', value: '祁家山社区' }
  ],
  '长青街道': [
    { label: '长青社区', value: '长青社区' },
    { label: '兴达社区', value: '兴达社区' }
  ],
  '慈惠街道': [
    { label: '慈惠社区', value: '慈惠社区' },
    { label: '鸦渡社区', value: '鸦渡社区' }
  ],
  '走马岭街道': [
    { label: '走马岭社区', value: '走马岭社区' },
    { label: '苗湖社区', value: '苗湖社区' }
  ],
  '径河街道': [
    { label: '径河社区', value: '径河社区' },
    { label: '官塘角社区', value: '官塘角社区' }
  ],
  '蔡甸街道': [
    { label: '蔡甸社区', value: '蔡甸社区' },
    { label: '正街社区', value: '正街社区' }
  ],
  '奓山街道': [
    { label: '奓山社区', value: '奓山社区' },
    { label: '星光社区', value: '星光社区' }
  ],
  '永安街道': [
    { label: '永安社区', value: '永安社区' },
    { label: '老湾社区', value: '老湾社区' }
  ],
  '侏儒山街道': [
    { label: '侏儒山社区', value: '侏儒山社区' },
    { label: '檀山社区', value: '檀山社区' }
  ],
  '大集街道': [
    { label: '大集社区', value: '大集社区' },
    { label: '南湖社区', value: '南湖社区' }
  ],
  '纸坊街道': [
    { label: '纸坊社区', value: '纸坊社区' },
    { label: '古驿社区', value: '古驿社区' }
  ],
  '金口街道': [
    { label: '金口社区', value: '金口社区' },
    { label: '金水社区', value: '金水社区' }
  ],
  '乌龙泉街道': [
    { label: '乌龙泉社区', value: '乌龙泉社区' },
    { label: '矿埠社区', value: '矿埠社区' }
  ],
  '郑店街道': [
    { label: '郑店社区', value: '郑店社区' },
    { label: '黄金桥社区', value: '黄金桥社区' }
  ],
  '五里界街道': [
    { label: '五里界社区', value: '五里界社区' },
    { label: '唐涂社区', value: '唐涂社区' }
  ],
  '前川街道': [
    { label: '前川社区', value: '前川社区' },
    { label: '双凤社区', value: '双凤社区' }
  ],
  '横店街道': [
    { label: '横店社区', value: '横店社区' },
    { label: '中华社区', value: '中华社区' }
  ],
  '罗汉寺街道': [
    { label: '罗汉寺社区', value: '罗汉寺社区' },
    { label: '沈黄社区', value: '沈黄社区' }
  ],
  '滠口街道': [
    { label: '滠口社区', value: '滠口社区' },
    { label: '振兴社区', value: '振兴社区' }
  ],
  '祁家湾街道': [
    { label: '祁家湾社区', value: '祁家湾社区' },
    { label: '红星社区', value: '红星社区' }
  ],
  '邾城街道': [
    { label: '邾城社区', value: '邾城社区' },
    { label: '向荣社区', value: '向荣社区' }
  ],
  '阳逻街道': [
    { label: '阳逻社区', value: '阳逻社区' },
    { label: '潘庙社区', value: '潘庙社区' }
  ],
  '仓埠街道': [
    { label: '仓埠社区', value: '仓埠社区' },
    { label: '项山社区', value: '项山社区' }
  ],
  '汪集街道': [
    { label: '汪集社区', value: '汪集社区' },
    { label: '陶咀社区', value: '陶咀社区' }
  ],
  '李集街道': [
    { label: '李集社区', value: '李集社区' },
    { label: '八屋社区', value: '八屋社区' }
  ]
}

const filteredStreets = ref([])
const filteredCommunities = ref([])

function onDistrictChange() {
  form.street = ''
  form.community = ''
  filteredStreets.value = streetOptions[form.district] || []
  filteredCommunities.value = []
}

function onStreetChange() {
  form.community = ''
  filteredCommunities.value = communityOptions[form.street] || []
}

const counting = ref(false)
const countdown = ref(60)

const sendCode = () => {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (counting.value) return

  form.code = '123456'
  counting.value = true
  countdown.value = 60

  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
    }
  }, 1000)
}

const register = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    if (!form.agree) {
      ElMessage.warning('请先阅读并同意服务协议')
      return
    }
    ElMessage.success('注册成功！即将跳转到登录页面...')
    setTimeout(() => {
      router.push('/login/community')
    }, 1500)
  })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  margin: 15px 0 5px;
  color: #303133;
}

.register-header p {
  color: #909399;
  font-size: 14px;
}

.register-form {
  margin-bottom: 20px;
}

.code-input {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input .el-input {
  flex: 1;
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .register-container {
    padding: 30px 20px;
  }
}
</style>
