<template>
  <div class="sms-code-input" :class="themeClass">
    <!-- 手机号输入 -->
    <div v-if="showPhone" class="form-group">
      <label v-if="label">{{ label }}</label>
      <div class="input-addon">
        <span v-if="showPrefix" class="addon">+86</span>
        <input
          class="form-control"
          :class="{ 'with-prefix': showPrefix }"
          :value="phone"
          @input="onPhoneInput"
          :placeholder="phonePlaceholder"
          type="tel"
          maxlength="11"
          :disabled="disabled"
        />
      </div>
    </div>

    <!-- 验证码输入 -->
    <div class="form-group">
      <label v-if="codeLabel">{{ codeLabel }}</label>
      <div class="code-input-wrap">
        <input
          class="form-control code-input"
          :value="modelValue"
          @input="onCodeInput"
          :placeholder="placeholder"
          type="text"
          maxlength="6"
          :disabled="disabled"
          @keyup.enter="$emit('enter')"
        />
        <button
          class="code-btn"
          @click="handleSendCode"
          :disabled="sendDisabled || counting"
          :class="{ disabled: sendDisabled || counting }"
        >
          {{ counting ? `${countdown}s` : sendText }}
        </button>
      </div>
      <div v-if="tip" class="input-tip">{{ tip }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  // 验证码值（v-model）
  modelValue: {
    type: String,
    default: ''
  },
  // 手机号（v-model:phone）
  phone: {
    type: String,
    default: ''
  },
  // 是否显示手机号输入
  showPhone: {
    type: Boolean,
    default: true
  },
  // 是否显示+86前缀
  showPrefix: {
    type: Boolean,
    default: true
  },
  // 手机号标签
  label: {
    type: String,
    default: '手机号'
  },
  // 验证码标签
  codeLabel: {
    type: String,
    default: '验证码'
  },
  // 手机号占位符
  phonePlaceholder: {
    type: String,
    default: '请输入手机号'
  },
  // 验证码占位符
  placeholder: {
    type: String,
    default: '请输入验证码'
  },
  // 发送按钮文本
  sendText: {
    type: String,
    default: '获取验证码'
  },
  // 验证码类型（传递给后端）
  codeType: {
    type: String,
    default: 'login'
  },
  // 倒计时秒数
  countdownSeconds: {
    type: Number,
    default: 60
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 提示文本
  tip: {
    type: String,
    default: ''
  },
  // 主题：green（默认）、blue、red
  theme: {
    type: String,
    default: 'green'
  },
  // 自定义发送函数（如果提供，则使用此函数发送验证码）
  customSend: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update:phone', 'send', 'enter', 'phone-error', 'send-error'])

// 倒计时状态
const counting = ref(false)
const countdown = ref(props.countdownSeconds)
let timer = null

// 主题class
const themeClass = computed(() => {
  return props.theme !== 'green' ? `theme-${props.theme}` : ''
})

// 发送按钮是否禁用
const sendDisabled = computed(() => {
  if (!props.showPhone) return false
  return !/^1[3-9]\d{9}$/.test(props.phone)
})

// 手机号输入
const onPhoneInput = (e) => {
  emit('update:phone', e.target.value)
}

// 验证码输入
const onCodeInput = (e) => {
  emit('update:modelValue', e.target.value)
}

// 发送验证码
const handleSendCode = async () => {
  if (counting.value) return
  
  // 验证手机号
  if (props.showPhone) {
    if (!props.phone) {
      emit('phone-error', '请填写手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(props.phone)) {
      emit('phone-error', '请输入正确的手机号')
      return
    }
  }

  try {
    // 如果提供了自定义发送函数，则使用它
    if (props.customSend) {
      await props.customSend({
        phone: props.phone,
        type: props.codeType
      })
    } else {
      // 否则触发 send 事件，由父组件处理
      emit('send', {
        phone: props.phone,
        type: props.codeType
      })
    }

    // 开始倒计时
    startCountdown()
  } catch (error) {
    emit('send-error', error)
  }
}

// 开始倒计时
const startCountdown = () => {
  counting.value = true
  countdown.value = props.countdownSeconds
  
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

// 停止倒计时
const stopCountdown = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  counting.value = false
  countdown.value = props.countdownSeconds
}

// 暴露方法供父组件调用
defineExpose({
  startCountdown,
  stopCountdown,
  counting
})

// 组件销毁时清除定时器
onBeforeUnmount(() => {
  stopCountdown()
})
</script>

<style scoped>
.sms-code-input {
  width: 100%;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 7px;
}

.input-addon {
  display: flex;
}

.input-addon .addon {
  padding: 12px 14px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-right: none;
  border-radius: 10px 0 0 10px;
  font-size: 15px;
  color: #555;
  white-space: nowrap;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  font-family: inherit;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #26a269;
}

.form-control:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-control.with-prefix {
  border-radius: 0 10px 10px 0;
}

.code-input-wrap {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
}

.code-btn {
  padding: 10px 16px;
  background: #e8f7ed;
  color: #26a269;
  border: 2px solid #26a269;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-family: inherit;
  min-width: 110px;
}

.code-btn:hover:not(:disabled) {
  background: #26a269;
  color: #fff;
}

.code-btn:disabled,
.code-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 蓝色主题 */
.theme-blue .code-btn {
  background: #e8f0fe;
  color: #1967d2;
  border-color: #1967d2;
}

.theme-blue .code-btn:hover:not(:disabled) {
  background: #1967d2;
  color: #fff;
}

.theme-blue .form-control:focus {
  border-color: #1967d2;
}

/* 红色主题 */
.theme-red .code-btn {
  background: #fce8e6;
  color: #d93025;
  border-color: #d93025;
}

.theme-red .code-btn:hover:not(:disabled) {
  background: #d93025;
  color: #fff;
}

.theme-red .form-control:focus {
  border-color: #d93025;
}
</style>
