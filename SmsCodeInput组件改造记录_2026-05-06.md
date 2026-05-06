# SmsCodeInput验证码组件改造 - 修改记录

**日期**: 2026-05-06  
**操作人**: 墨砚 🧩

---

## 📋 改造目标

将邻盟项目中各登录/注册页面的验证码输入功能抽取为可复用组件，方便益邻邻项目使用。

---

## ✅ 完成情况

### 1. 创建SmsCodeInput组件 ✅

**文件**: `client/src/components/SmsCodeInput.vue`

**功能特性**:
- ✅ 手机号输入（可选显示/隐藏）
- ✅ +86前缀（可选）
- ✅ 验证码输入
- ✅ 60秒倒计时
- ✅ v-model双向绑定
- ✅ 三种主题色（green/blue/red）
- ✅ 自定义发送函数
- ✅ 暴露方法（startCountdown/stopCountdown）

**主题配色**:
| 主题 | 颜色 | 适用场景 |
|------|------|----------|
| green | #26a269 | 社区端 |
| blue | #1967d2 | 商家端/管理后台 |
| red | #d93025 | 大使端 |

---

### 2. 改造登录页面 ✅

#### 社区端 Login.vue
```vue
<!-- 改造前：30行验证码相关代码 -->
<el-form-item label="验证码">
  <div class="code-input">
    <el-input v-model="form.code" placeholder="请输入验证码" />
    <el-button @click="sendCode" :disabled="counting">
      {{ counting ? `${countdown}s` : '获取验证码' }}
    </el-button>
  </div>
</el-form-item>

<!-- 改造后：1行组件调用 -->
<SmsCodeInput
  v-model="form.code"
  v-model:phone="form.phone"
  codeType="login"
  theme="green"
  :customSend="sendCode"
/>
```

#### 商家端 Login.vue
```vue
<SmsCodeInput
  v-model="form.code"
  v-model:phone="form.phone"
  codeType="login"
  theme="blue"
  :customSend="sendCode"
/>
```

#### 大使端 Login.vue
```vue
<SmsCodeInput
  v-model="loginForm.code"
  v-model:phone="loginForm.phone"
  codeType="login"
  theme="red"
  :customSend="sendCode"
  @enter="doLogin"
/>
```

---

### 3. 改造注册页面 ✅

#### 社区注册 Register.vue
```vue
<SmsCodeInput
  v-model="form.code"
  v-model:phone="form.phone"
  codeType="register"
  theme="blue"
  :showPhone="true"
  :customSend="sendCode"
  @enter="register"
/>
```

#### 商家注册 Register.vue
```vue
<!-- 商家注册 -->
<SmsCodeInput
  v-model="form.code"
  v-model:phone="form.phone"
  codeType="register"
  theme="green"
  :showPhone="false"
  :customSend="sendMerchantCode"
/>

<!-- 专家注册 -->
<SmsCodeInput
  v-model="expertForm.code"
  v-model:phone="expertForm.phone"
  codeType="register"
  theme="blue"
  :showPhone="false"
  :customSend="sendExpertCode"
/>
```

---

### 4. 复制到益邻邻项目 ✅

**目标路径**: `D:\yilinlin\yilinlin-h5-admin\src\components\SmsCodeInput.vue`

**备注**: 益邻邻管理后台使用用户名密码登录，无需验证码组件。组件已就绪，待后续需要时使用。

---

## 📊 代码量对比

| 页面 | 改造前 | 改造后 | 减少 |
|------|--------|--------|------|
| 社区登录 | ~280行 | ~220行 | **-60行** |
| 商家登录 | ~190行 | ~150行 | **-40行** |
| 大使登录 | ~210行 | ~170行 | **-40行** |
| 社区注册 | ~315行 | ~280行 | **-35行** |
| 商家注册 | ~850行 | ~780行 | **-70行** |
| **合计** | ~1845行 | ~1600行 | **-245行** |

---

## 🔄 使用说明

### 基础用法
```vue
<template>
  <SmsCodeInput
    v-model="code"
    v-model:phone="phone"
    :customSend="sendCode"
  />
</template>

<script setup>
import SmsCodeInput from '@/components/SmsCodeInput.vue'

const phone = ref('')
const code = ref('')

const sendCode = async ({ phone, type }) => {
  await sendSms({ phone, type })
}
</script>
```

### Props属性
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | String | '' | 验证码值 |
| phone | String | '' | 手机号 |
| showPhone | Boolean | true | 显示手机号输入 |
| showPrefix | Boolean | true | 显示+86前缀 |
| theme | String | 'green' | 主题色 |
| countdownSeconds | Number | 60 | 倒计时秒数 |
| customSend | Function | null | 自定义发送函数 |

### Events事件
| 事件 | 参数 | 说明 |
|------|------|------|
| send | { phone, type } | 点击发送按钮 |
| enter | - | 按下回车键 |
| phone-error | 错误信息 | 手机号验证失败 |

### 暴露方法
| 方法 | 说明 |
|------|------|
| startCountdown() | 开始倒计时 |
| stopCountdown() | 停止倒计时 |

---

## 📦 交付物清单

| 文件 | 路径 | 说明 |
|------|------|------|
| SmsCodeInput组件 | `client/src/components/SmsCodeInput.vue` | 验证码组件 |
| 使用说明 | `SmsCodeInput使用说明.md` | 详细文档 |
| 邻盟前端 | 已上传到服务器 | ✅ 已部署 |
| 益邻邻组件 | `yilinlin-h5-admin/src/components/SmsCodeInput.vue` | ✅ 已复制 |

---

## 🎯 优势

1. **代码复用** - 避免重复编写验证码逻辑
2. **统一样式** - 所有登录页风格一致
3. **易于维护** - 修改组件即可影响所有使用位置
4. **灵活配置** - 支持多种使用场景
5. **主题支持** - 可适配不同角色配色

---

## 📝 备注

- 构建状态：✅ 编译通过
- 部署状态：✅ 已上传到服务器
- 组件已复制到益邻邻项目，待后续使用
