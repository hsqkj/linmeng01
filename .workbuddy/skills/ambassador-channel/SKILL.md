---
name: ambassador-channel
description: |
  招商大使专属渠道码生成与管理技能。当用户需要为招商大使生成专属二维码、渠道链接，或需要实现渠道码相关的功能开发时使用此技能。支持功能：生成唯一渠道码、创建带logo的二维码图片、下载二维码、复制专属注册链接。
---

# 招商大使渠道码技能

本技能用于生成和管理招商大使的专属渠道码，包含真实二维码生成、下载和分享功能。

## 核心功能

### 1. 渠道码数据结构

```javascript
// 渠道码格式
{
  qr_code: "AMBXXXXXXXXXX",  // AMB前缀 + 时间戳36进制 + 随机4位
  register_url: "http://domain/#/register?code=AMBXXXXXX",  // 完整注册链接
  ambassador_name: "张三"
}
```

### 2. 数据库字段要求

 ambassadors 表需要有 qr_code 字段：
```sql
ALTER TABLE ambassadors ADD COLUMN qr_code VARCHAR(255) COMMENT '渠道码' AFTER id_card;
```

### 3. 后端API实现

#### 获取/生成渠道码接口
```javascript
// routes/ambassador.js
router.get('/qrcode', authAmbassador, AmbassadorController.getQrCode)

// controllers/ambassadorController.js
exports.getQrCode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, real_name, qr_code FROM ambassadors WHERE id = ?',
      [req.ambassador.id]
    )
    
    const ambassador = rows[0]
    
    // 如果没有渠道码，自动生成
    if (!ambassador.qr_code) {
      const qrCode = 'AMB' + Date.now().toString(36).toUpperCase() + 
                     Math.random().toString(36).substring(2, 6).toUpperCase()
      await pool.query(
        'UPDATE ambassadors SET qr_code = ? WHERE id = ?',
        [qrCode, req.ambassador.id]
      )
      ambassador.qr_code = qrCode
    }
    
    const baseUrl = process.env.APP_URL || 'http://localhost:5173'
    const registerUrl = `${baseUrl}/#/register?code=${ambassador.qr_code}`
    
    success(res, {
      qr_code: ambassador.qr_code,
      register_url: registerUrl,
      ambassador_name: ambassador.real_name || ambassador.username
    })
  } catch (err) {
    error(res, '获取渠道码失败')
  }
}
```

### 4. 前端实现要点

#### 安装二维码库
```bash
npm install qrcode
```

#### 核心代码
```vue
<template>
  <div class="qr-image">
    <canvas ref="qrCanvas"></canvas>
  </div>
  <div class="qr-code-text">{{ qrCode }}</div>
</template>

<script setup>
import QRCode from 'qrcode'

const qrCanvas = ref(null)
const registerUrl = ref('')

async function generateQRCode() {
  if (!qrCanvas.value || !registerUrl.value) return
  
  await QRCode.toCanvas(qrCanvas.value, registerUrl.value, {
    width: 180,
    margin: 1,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff'
    }
  })
}

// 下载二维码
async function downloadQR() {
  const dataUrl = qrCanvas.value.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `邻盟渠道码_${qrCode.value}.png`
  link.href = dataUrl
  link.click()
}

// 复制链接
async function copyLink() {
  await navigator.clipboard.writeText(registerUrl.value)
}
</script>
```

### 5. 手机端适配

```css
@media (max-width: 768px) {
  .qrcode-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .qrcode-card {
    max-width: 320px;
    margin: 0 auto;
    padding: 20px;
  }
  .qr-canvas {
    width: 150px !important;
    height: 150px !important;
  }
}
```

## 使用场景

1. **新大使入驻** - 为新注册的大使自动生成唯一渠道码
2. **渠道推广** - 生成可下载的二维码图片用于线下推广
3. **链接分享** - 复制专属注册链接通过社交媒体分享
4. **数据统计** - 通过渠道码追踪每个大使的发展效果

## 相关文件

- 后端路由: `server/src/routes/ambassador.js`
- 后端控制器: `server/src/controllers/ambassadorController.js`
- 前端API: `client/src/api/ambassador.js`
- 渠道码页面: `client/src/views/ambassador/Qrcode.vue`
- 数据库脚本: `server/scripts/generate-ambassador-codes.js`
