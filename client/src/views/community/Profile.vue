<template>
  <div class="page">
    <h2>个人中心</h2>

    <el-row :gutter="20">
      <!-- 左侧：社区基本信息 -->
      <el-col :span="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" src="" style="background:#1a56db">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </el-avatar>
            <div class="community-name">{{ profile.communityName }}</div>
            <div class="district-name">{{ profile.district }} · {{ profile.street }}</div>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ profile.demands }}</div><div class="stat-label">发布需求</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.matchings }}</div><div class="stat-label">撮合成功</div></div>
            <div class="stat-item"><div class="stat-val">¥{{ profile.rewards }}</div><div class="stat-label">获得奖励</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑社区资料</el-button>
        </div>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :span="16">
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
                <el-descriptions-item label="社区名称">{{ profile.communityName }}</el-descriptions-item>
                <el-descriptions-item label="小区名称">{{ profile.estateName }}</el-descriptions-item>
                <el-descriptions-item label="所属行政区">{{ profile.district }}</el-descriptions-item>
                <el-descriptions-item label="所属街道">{{ profile.street }}</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ profile.contactName }}</el-descriptions-item>
                <el-descriptions-item label="联系手机">{{ profile.phone }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">2026-01-10</el-descriptions-item>
                <el-descriptions-item label="审核状态"><el-tag type="success" size="small">已通过</el-tag></el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="社区画像" name="portrait">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="小区总户数">{{ profile.households }}户</el-descriptions-item>
                <el-descriptions-item label="社区商户数">{{ profile.merchantCount }}家</el-descriptions-item>
                <el-descriptions-item label="亲子家庭占比">{{ profile.parentKidRatio }}</el-descriptions-item>
                <el-descriptions-item label="老年群体占比">{{ profile.elderRatio }}</el-descriptions-item>
                <el-descriptions-item label="公共空间面积">{{ profile.publicArea }}</el-descriptions-item>
                <el-descriptions-item label="户外广场">{{ profile.outdoorSquare }}</el-descriptions-item>
                <el-descriptions-item label="商业体/商业街">{{ profile.commercial }}</el-descriptions-item>
                <el-descriptions-item label="学校/幼儿园">{{ profile.school }}</el-descriptions-item>
                <el-descriptions-item label="公园/体育场馆">{{ profile.park }}</el-descriptions-item>
                <el-descriptions-item label="简介" :span="2">{{ profile.intro }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="我的标签" name="tags">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">标签越精准，智能匹配效果越好</p>
              <div class="tag-list">
                <el-tag v-for="tag in profile.tags" :key="tag" style="margin:4px">{{ tag }}</el-tag>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">管理标签</el-button>
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
          <el-form :model="editForm" label-width="130px" ref="formRef">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="社区名称" required>
                  <el-input v-model="editForm.communityName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="小区名称">
                  <el-input v-model="editForm.estateName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人姓名" required>
                  <el-input v-model="editForm.contactName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系手机" required>
                  <el-input v-model="editForm.phone" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">社区画像数据</el-divider>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="小区总户数">
                  <el-input-number v-model="editForm.households" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="社区商户数">
                  <el-input-number v-model="editForm.merchantCount" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="亲子家庭占比">
                  <el-input v-model="editForm.parentKidRatio" placeholder="如：35%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="老年群体占比">
                  <el-input v-model="editForm.elderRatio" placeholder="如：28%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="公共空间面积">
                  <el-input v-model="editForm.publicArea" placeholder="如：2000㎡" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="户外广场">
                  <el-input v-model="editForm.outdoorSquare" placeholder="如：有，约800㎡" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商业体/商业街">
                  <el-input v-model="editForm.commercial" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="学校/幼儿园">
                  <el-input v-model="editForm.school" placeholder="如：幼儿园1所、小学1所" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="公园/体育场馆">
                  <el-input v-model="editForm.park" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="社区简介">
                  <el-input v-model="editForm.intro" type="textarea" :rows="3" placeholder="简要介绍社区特色..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">社区标签</el-divider>
            <el-form-item label="选择标签">
              <div class="tag-selector">
                <el-check-tag v-for="tag in allTags" :key="tag" :checked="editForm.tags.includes(tag)" @change="toggleTag(tag)" style="margin:4px">{{ tag }}</el-check-tag>
              </div>
            </el-form-item>

            <div style="text-align:right;margin-top:16px">
              <el-button @click="editing=false">取消</el-button>
              <el-button type="primary" @click="saveProfile">保存资料</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Edit } from '@element-plus/icons-vue'

const editing = ref(false)
const infoTab = ref('basic')

const profile = reactive({
  communityName: '光谷社区', estateName: '光谷花园小区', district: '东湖新技术开发区', street: '关东街道',
  contactName: '张主任', phone: '138****1234', households: 1500, merchantCount: 120,
  parentKidRatio: '38%', elderRatio: '25%', publicArea: '3500㎡', outdoorSquare: '有，约1200㎡',
  commercial: '有，光谷步行街', school: '幼儿园2所、小学1所、中学1所', park: '社区公园2处、健身步道500米',
  intro: '光谷社区是东湖新技术开发区重点社区，居民结构多元，高科技人才占比高，社区公共空间丰富，年均举办大型活动8~10场。',
  demands: 8, matchings: 5, rewards: '1000',
  tags: ['亲子友好', '老年服务', '文化活动', '体育赛事', '教育资源', '健康社区']
})

const allTags = ['亲子友好', '老年服务', '文化活动', '体育赛事', '教育资源', '健康社区', '公益活动', '科技创新', '环保绿色', '商业活跃', '居民参与度高', '节庆氛围浓']

const editForm = reactive({ ...profile })

function startEdit() {
  Object.assign(editForm, JSON.parse(JSON.stringify(profile)))
  editing.value = true
  infoTab.value = 'basic'
}

function toggleTag(tag) {
  const idx = editForm.tags.indexOf(tag)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(tag)
}

function saveProfile() {
  Object.assign(profile, JSON.parse(JSON.stringify(editForm)))
  editing.value = false
  ElMessage.success('社区资料已保存，等待平台审核后更新显示')
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
.stat-item { text-align: center; }
.stat-val { font-size: 22px; font-weight: 700; color: #1a56db; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.tag-list { display: flex; flex-wrap: wrap; }
.tag-selector { display: flex; flex-wrap: wrap; }
</style>
