# SmsCodeInput 验证码组件使用说明

## 📋 组件功能

这是一个可复用的短信验证码输入组件，支持：
- 手机号输入（可选）
- 验证码输入和发送
- 倒计时功能
- 多种主题配色
- v-model 双向绑定

---

## 🚀 基础用法

### 1. 完整模式（含手机号）

```vue
<template>
  <SmsCodeInput
    v-model="code"
    v-model:phone="phone"
    :sendCode="handleSendCode"
    @enter="handleLogin"
  />
</template>

<script setup>
import { ref } from 'vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import { sendSms } from '@/api/public'

const phone = ref('')
const code = ref('')

// 发送验证码
const handleSendCode = async ({ phone, type }) => {
  await sendSms({ phone, type: 'login' })
}

const handleLogin = () => {
  // 登录逻辑
}
</script>
```

---

### 2. 仅验证码模式

```vue
<template>
  <SmsCodeInput
    v-model="code"
    :showPhone="false"
    sendText="获取验证码"
    @send="handleSend"
  />
</template>

<script setup>
import { ref } from 'vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'

const code = ref('')

const handleSend = ({ phone, type }) => {
  // 发送验证码逻辑
}
</script>
```

---

## 📝 Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` (v-model) | String | `''` | 验证码值 |
| `phone` (v-model:phone) | String | `''` | 手机号 |
| `showPhone` | Boolean | `true` | 是否显示手机号输入 |
| `showPrefix` | Boolean | `true` | 是否显示+86前缀 |
| `label` | String | `'手机号'` | 手机号标签文本 |
| `codeLabel` | String | `'验证码'` | 验证码标签文本 |
| `phonePlaceholder` | String | `'请输入手机号'` | 手机号占位符 |
| `placeholder` | String | `'请输入验证码'` | 验证码占位符 |
| `sendText` | String | `'获取验证码'` | 发送按钮文本 |
| `codeType` | String | `'login'` | 验证码类型（传递给后端） |
| `countdownSeconds` | Number | `60` | 倒计时秒数 |
| `theme` | String | `'green'` | 主题色（green/blue/red） |
| `disabled` | Boolean | `false` | 是否禁用 |
| `tip` | String | `''` | 提示文本 |
| `customSend` | Function | `null` | 自定义发送函数 |

---

## 🎯 Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | 验证码值 | v-model 绑定 |
| `update:phone` | 手机号 | v-model:phone 绑定 |
| `send` | `{ phone, type }` | 点击发送按钮时触发 |
| `enter` | - | 按下回车键时触发 |
| `phone-error` | 错误信息 | 手机号验证失败时触发 |
| `send-error` | 错误对象 | 发送失败时触发 |

---

## 🔧 Exposed Methods 暴露方法

| 方法名 | 说明 |
|--------|------|
| `startCountdown()` | 开始倒计时（手动触发） |
| `stopCountdown()` | 停止倒计时 |
| `counting` | 是否正在倒计时（响应式） |

---

## 🎨 主题配置

组件内置3种主题：

```vue
<!-- 绿色主题（默认，适用于社区端） -->
<SmsCodeInput theme="green" ... />

<!-- 蓝色主题（适用于商家端/管理后台） -->
<SmsCodeInput theme="blue" ... />

<!-- 红色主题（适用于大使端/警告场景） -->
<SmsCodeInput theme="red" ... />
```

---

## 📱 实际应用示例

### 邻盟 - 社区端登录

```vue
<template>
  <div class="login-card">
    <h2>社区工作者登录</h2>
    
    <SmsCodeInput
      v-model="form.code"
      v-model:phone="form.phone"
      codeType="login"
      theme="green"
      :customSend="sendCode"
      @enter="login"
    />
    
    <button @click="login" :disabled="loading">登录</button>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import { sendSms } from '@/api/public'
import { communityLogin } from '@/api/community'

const form = reactive({ phone: '', code: '' })
const loading = ref(false)

const sendCode = async ({ phone, type }) => {
  await sendSms({ phone, type })
  ElMessage.success('验证码已发送')
}

const login = async () => {
  loading.value = true
  try {
    const res = await communityLogin({
      phone: form.phone,
      code: form.code
    })
    localStorage.setItem('community_token', res.data.token)
    location.href = '/#/community'
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
```

---

### 益邻邻 - 发布者登录

```vue
<template>
  <div class="login-container">
    <h2>益邻邻登录</h2>
    
    <SmsCodeInput
      v-model="code"
      v-model:phone="phone"
      codeType="login"
      theme="blue"
      :customSend="handleSendCode"
    />
    
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SmsCodeInput from '@/components/SmsCodeInput.vue'
import { sendVerifyCode } from '@/api/yilinlin'

const phone = ref('')
const code = ref('')

const handleSendCode = async ({ phone: phoneNum, type }) => {
  await sendVerifyCode({ phone: phoneNum, type })
}
</script>
```

---

## 🔄 迁移指南

### 原有代码（Login.vue）

```vue
<!-- 旧代码 -->
<div class="form-group">
  <label>验证码</label>
  <div style="display:flex;gap:10px">
    <input class="form-control" v-model="form.code" placeholder="请输入验证码" style="flex:1" />
    <button class="code-btn" @click="sendCode" :disabled="counting">
      {{ counting ? `${countdown}s` : '获取验证码' }}
    </button>
  </div>
</div>
```

### 新代码（使用组件）

```vue
<!-- 新代码 -->
<SmsCodeInput
  v-model="form.code"
  v-model:phone="form.phone"
  :customSend="sendCode"
  theme="green"
/>
```

---

## 📦 组件文件路径

```
D:\WorkBuddy\20260331205655\client\src\components\SmsCodeInput.vue
```

---

## ✅ 优势

1. **代码复用** - 避免重复编写验证码逻辑
2. **统一样式** - 所有登录页风格一致
3. **易于维护** - 修改组件即可影响所有使用位置
4. **类型安全** - 支持 TypeScript（可选）
5. **灵活配置** - 支持多种使用场景

---

## 🐛 常见问题

### Q: 如何自定义发送逻辑？
A: 使用 `:customSend` 属性传入自定义函数

### Q: 如何手动控制倒计时？
A: 使用 `ref` 获取组件实例，调用 `startCountdown()` 方法

### Q: 如何适配益邻邻项目？
A: 复制组件到益邻邻项目，修改 API 调用路径即可

---

**创建时间**: 2026-05-06  
**创建者**: 墨砚 🧩
