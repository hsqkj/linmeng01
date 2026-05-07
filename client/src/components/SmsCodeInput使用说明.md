# SmsCodeInput 组件使用说明

## 文件位置

- **邻盟项目**：`client/src/components/SmsCodeInput.vue`
- **益邻邻项目**：`src/components/SmsCodeInput.vue`（已同步）

## Props（属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | String | `''` | 验证码值（v-model） |
| `phone` | String | `''` | 手机号值（v-model:phone） |
| `showPhone` | Boolean | `true` | 是否显示手机号输入框 |
| `showPrefix` | Boolean | `true` | 是否显示 +86 前缀 |
| `label` | String | `'手机号'` | 手机号标签 |
| `codeLabel` | String | `'验证码'` | 验证码标签 |
| `phonePlaceholder` | String | `'请输入手机号'` | 手机号占位符 |
| `placeholder` | String | `'请输入验证码'` | 验证码占位符 |
| `sendText` | String | `'获取验证码'` | 发送按钮文字 |
| `codeType` | String | `'login'` | 验证码类型（传给后端） |
| `countdownSeconds` | Number | `60` | 倒计时秒数 |
| `disabled` | Boolean | `false` | 是否禁用 |
| `tip` | String | `''` | 提示文字 |
| `theme` | String | `'green'` | 主题：green / blue / red |
| `customSend` | Function | `null` | 自定义发送函数 |

## Emits（事件）

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | `value` | 验证码值变化 |
| `update:phone` | `value` | 手机号值变化 |
| `send` | `{ phone, type }` | 点击发送按钮（父组件自行调用 API） |
| `enter` | - | 按下回车键 |
| `phone-error` | `msg` | 手机号格式错误 |
| `send-error` | `error` | 发送失败（由父组件 throw 触发） |

## 使用方式一：customSend（推荐，邻盟项目）

传入 `customSend` 函数，组件自动调用并处理倒计时、错误提示：

```vue
<template>
  <SmsCodeInput
    v-model="form.code"
    v-model:phone="form.phone"
    :customSend="handleSendCode"
    theme="green"
    @phone-error="(msg) => ElMessage.warning(msg)"
    @send-error="(err) => ElMessage.error(err?.message || '发送失败')"
  />
</template>

<script setup>
import { sendSms } from '@/api/public'  // 邻盟项目

async function handleSendCode({ phone, type }) {
  try {
    await sendSms({ phone, type })
    ElMessage.success('验证码已发送')
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '发送失败')
    throw err  // 重要：throw 才能让组件不启动倒计时
  }
}
</script>
```

## 使用方式二：@send 事件（益邻邻项目）

不传 `customSend`，监听 `@send` 事件自行调用 API：

```vue
<template>
  <SmsCodeInput
    v-model="form.code"
    v-model:phone="form.phone"
    code-type="login"
    theme="blue"
    @send="onSendCode"
    @phone-error="(msg) => alert(msg)"
    @send-error="(err) => alert(err.message)"
  />
</template>

<script setup>
import axios from 'axios'

// 益邻邻项目：使用自己的 axios 实例
const baseURL = '/yilinlin-api'  // 或 import.meta.env.VITE_API_BASE

async function onSendCode({ phone, type }) {
  try {
    const res = await axios.post(`${baseURL}/public/sms/send`, { phone, type })
    if (res.data.code === 0) {
      // 成功，组件会自动启动倒计时
    } else {
      throw new Error(res.data.msg || '发送失败')
    }
  } catch (err) {
    throw err  // 重要：throw 才能让组件不启动倒计时
  }
}
</script>
```

## 主题颜色

| 主题 | 颜色 | 适用场景 |
|------|------|----------|
| `green` | 🟢 绿色 `#26a269` | 社区端 |
| `blue` | 🔵 蓝色 `#1967d2` | 商家端 / 注册页 |
| `red` | 🔴 红色 `#d93025` | 大使端 |

## 注意事项

1. **`throw err` 是关键**：发送失败时必须 `throw err`（或 `throw new Error(msg)`），否则组件会认为成功并启动倒计时
2. **手机号验证**：组件会在 `showPhone=true` 时自动验证格式，格式错误触发 `@phone-error`
3. **重复点击**：组件内部已有 `counting` 状态保护，但建议后端也做 60 秒限制
4. **测试账号**：邻盟后端对 `18800000001/02/03` 跳过验证码验证，方便测试
