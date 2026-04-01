<template>
  <div class="page">
    <h2>商家中心</h2>

    <el-row :gutter="20">
      <!-- 左侧商家信息卡 -->
      <el-col :span="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png">
              <el-icon :size="40"><Shop /></el-icon>
            </el-avatar>
            <div class="merchant-name">{{ profile.merchantName }}</div>
            <div class="merchant-type">{{ profile.merchantType }}</div>
            <el-tag type="warning" style="margin-top:8px">金牌会员 Lv3</el-tag>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ profile.resourceCount }}</div><div class="stat-label">发布资源</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.matchings }}</div><div class="stat-label">撮合成功</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.viewCount }}</div><div class="stat-label">总浏览</div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">编辑商家资料</el-button>
        </div>
      </el-col>

      <!-- 右侧详细信息 -->
      <el-col :span="16">
        <el-card v-if="!editing">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">商家详细资料</span>
              <el-button text type="primary" @click="startEdit"><el-icon><Edit /></el-icon> 编辑</el-button>
            </div>
          </template>
          <el-tabs v-model="infoTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="企业名称">{{ profile.merchantName }}</el-descriptions-item>
                <el-descriptions-item label="行业分类">{{ profile.industryCategory || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="企业规模">{{ profile.scale }}</el-descriptions-item>
                <el-descriptions-item label="成立时间">{{ profile.foundYear }}</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ profile.contactName }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ profile.phone }}</el-descriptions-item>
                <el-descriptions-item label="企业地址" :span="2">{{ profile.address }}</el-descriptions-item>
                <el-descriptions-item label="Logo">
                  <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                </el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ profile.registerTime }}</el-descriptions-item>
                <el-descriptions-item label="审核状态"><el-tag type="success" size="small">已通过</el-tag></el-descriptions-item>
                <el-descriptions-item label="企业简介" :span="2">{{ profile.intro }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="图文介绍" name="gallery">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">可上传商品图文介绍、成功案例等，让社区更了解您的品牌</p>
              <el-empty v-if="!profile.gallery || profile.gallery.length === 0" description="暂无图文介绍" />
              <div v-else class="gallery-grid">
                <div v-for="(img, idx) in profile.gallery" :key="idx" class="gallery-item">
                  <el-image :src="img.url" fit="cover" style="width:100%;height:120px;border-radius:6px" />
                  <div class="gallery-label">{{ img.label }}</div>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">添加/编辑图文</el-button>
            </el-tab-pane>

            <el-tab-pane label="成功案例" name="cases">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">展示过往社区合作案例，增强社区信任</p>
              <el-empty v-if="!profile.cases || profile.cases.length === 0" description="暂无成功案例" />
              <div v-else class="cases-list">
                <div v-for="c in profile.cases" :key="c.title" class="case-item">
                  <div class="case-title">{{ c.title }}</div>
                  <div class="case-desc">{{ c.desc }}</div>
                  <div class="case-tags">
                    <el-tag v-for="t in c.tags" :key="t" size="small" style="margin:2px">{{ t }}</el-tag>
                  </div>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">添加/编辑案例</el-button>
            </el-tab-pane>

            <el-tab-pane label="专家介绍" name="experts">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">展示可提供专业服务的人员信息</p>
              <el-empty v-if="!profile.experts || profile.experts.length === 0" description="暂无专家介绍" />
              <div v-else class="experts-list">
                <div v-for="e in profile.experts" :key="e.name" class="expert-item">
                  <el-avatar :size="48" :src="e.avatar"><el-icon><User /></el-icon></el-avatar>
                  <div class="expert-info">
                    <div class="expert-name">{{ e.name }} <el-tag size="small" type="info">{{ e.title }}</el-tag></div>
                    <div class="expert-desc">{{ e.desc }}</div>
                  </div>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">添加/编辑专家</el-button>
            </el-tab-pane>

            <el-tab-pane label="社会职务" name="duties">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">展示企业担任的社会职务、荣誉资质等</p>
              <el-empty v-if="!profile.duties || profile.duties.length === 0" description="暂无社会职务信息" />
              <div v-else>
                <div v-for="d in profile.duties" :key="d" class="duty-item">
                  <el-icon color="#67C23A"><CircleCheck /></el-icon>
                  <span>{{ d }}</span>
                </div>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">添加/编辑职务</el-button>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 编辑表单 -->
        <el-card v-else>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">编辑商家资料</span>
              <el-button text @click="editing=false">取消</el-button>
            </div>
          </template>
          <el-form :model="editForm" label-width="130px">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="企业名称" required>
                  <el-input v-model="editForm.merchantName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="行业分类">
                  <el-select v-model="editForm.industryCategory" placeholder="请选择行业分类" style="width:100%" clearable>
                    <el-option v-for="t in merchantTypes" :key="t" :label="t" :value="t" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="企业规模">
                  <el-input v-model="editForm.scale" placeholder="如：50~200人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="成立时间">
                  <el-date-picker v-model="editForm.foundYear" type="year" style="width:100%" placeholder="选择年份" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人" required>
                  <el-input v-model="editForm.contactName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" required>
                  <el-input v-model="editForm.phone" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="企业地址">
                  <el-input v-model="editForm.address" placeholder="详细地址" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="企业简介">
                  <el-input v-model="editForm.intro" type="textarea" :rows="3" placeholder="简要介绍企业主营业务、优势等..." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">图文介绍（可上传多张商品/品牌图片）</el-divider>
            <el-form-item>
              <div class="gallery-edit">
                <div v-for="(img, idx) in editForm.gallery" :key="idx" class="gallery-edit-item">
                  <el-input v-model="img.label" placeholder="图片说明" style="margin-bottom:4px;width:200px" />
                  <div class="gallery-img-placeholder">{{ img.label || '图片' }}</div>
                  <el-button type="danger" size="small" text @click="editForm.gallery.splice(idx,1)">删除</el-button>
                </div>
                <el-button type="primary" text @click="editForm.gallery.push({label:'', url:''})">+ 添加图片</el-button>
              </div>
            </el-form-item>

            <el-divider content-position="left">成功案例</el-divider>
            <el-form-item v-for="(c, idx) in editForm.cases" :key="idx">
              <div class="case-edit-item">
                <el-input v-model="c.title" placeholder="案例标题" style="margin-bottom:4px" />
                <el-input v-model="c.desc" type="textarea" :rows="2" placeholder="案例描述" style="margin-bottom:4px" />
                <el-button type="danger" size="small" text @click="editForm.cases.splice(idx,1)">删除案例</el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" text @click="editForm.cases.push({title:'',desc:'',tags:[]})">+ 添加案例</el-button>
            </el-form-item>

            <el-divider content-position="left">专家介绍</el-divider>
            <el-form-item v-for="(e, idx) in editForm.experts" :key="idx">
              <div class="expert-edit-item">
                <el-row :gutter="8">
                  <el-col :span="8"><el-input v-model="e.name" placeholder="专家姓名" /></el-col>
                  <el-col :span="8"><el-input v-model="e.title" placeholder="职务/头衔" /></el-col>
                  <el-col :span="8"><el-button type="danger" size="small" @click="editForm.experts.splice(idx,1)">删除</el-button></el-col>
                </el-row>
                <el-input v-model="e.desc" type="textarea" :rows="2" placeholder="专家简介" style="margin-top:8px" />
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" text @click="editForm.experts.push({name:'',title:'',desc:'',avatar:''})">+ 添加专家</el-button>
            </el-form-item>

            <el-divider content-position="left">社会职务</el-divider>
            <el-form-item>
              <div class="duties-edit">
                <el-tag v-for="(d, idx) in editForm.duties" :key="idx" style="margin:4px" closable @close="editForm.duties.splice(idx,1)">{{ d }}</el-tag>
                <el-input v-model="newDuty" placeholder="输入后回车添加" style="width:200px;margin:4px" @keyup.enter="addDuty" />
              </div>
            </el-form-item>

            <el-divider content-position="left">我的标签</el-divider>
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
import { Shop, Edit, User, CircleCheck } from '@element-plus/icons-vue'

const editing = ref(false)
const infoTab = ref('basic')
const newDuty = ref('')
const merchantTypes = [
  '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果', '美业', '保健养生', '体育健身', '银行保险', '电信服务',
  '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材', '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
  '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰', '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
  '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体', '自媒体', 'IT互联网', '软件开发', '图文广告',
  '电子电器维修', '家居维修', '美发', '建筑工程', '其他'
]
const allTags = ['亲子活动', '老年服务', '文化活动', '体育赛事', '教育培训', '健康医疗', '科技科普', '节庆活动', '环保公益', '商业推广', '社区建设', '志愿服务']

const profile = reactive({
  merchantName: '星巴克咖啡',
  industryCategory: '餐饮小吃',
  scale: '10万~500人（全国连锁）',
  foundYear: '1999年',
  contactName: '李经理',
  phone: '138-1234-5678',
  address: '上海市浦东新区花木路888号',
  intro: '星巴克咖啡是美国连锁咖啡品牌，致力于为社区居民提供优质咖啡文化体验，积极参与社区公益活动。',
  registerTime: '2026-01-08',
  resourceCount: 8,
  matchings: 5,
  viewCount: 1234,
  gallery: [
    { url: '', label: '星巴克门店环境' },
    { url: '', label: '社区咖啡品鉴活动' }
  ],
  cases: [
    { title: '阳光花园社区咖啡文化节', desc: '2025年端午节，为社区提供咖啡饮品赞助200份，活动参与居民300+', tags: ['亲子活动', '节庆活动'] },
    { title: '社区志愿者感谢日', desc: '为社区志愿者提供免费咖啡券50张，获得居民一致好评', tags: ['志愿服务', '社区建设'] }
  ],
  experts: [
    { name: '张咖啡', title: '首席咖啡师', desc: '从业12年，擅长各类咖啡品鉴与文化推广', avatar: '' },
    { name: '李讲师', title: '社区活动策划', desc: '负责星巴克社区活动策划与执行，经验丰富', avatar: '' }
  ],
  duties: [
    '花木街道商会会员',
    '浦东新区社区公益合作伙伴',
    '上海连锁经营协会会员'
  ],
  tags: ['社区建设', '志愿服务', '商业推广', '文化活动']
})

const editForm = reactive(JSON.parse(JSON.stringify(profile)))
editForm.gallery = editForm.gallery.map(g => ({ ...g }))
editForm.cases = editForm.cases.map(c => ({ ...c }))
editForm.experts = editForm.experts.map(e => ({ ...e }))

function startEdit() {
  Object.assign(editForm, JSON.parse(JSON.stringify(profile)))
  editForm.gallery = (profile.gallery || []).map(g => ({ ...g }))
  editForm.cases = (profile.cases || []).map(c => ({ ...c }))
  editForm.experts = (profile.experts || []).map(e => ({ ...e }))
  editing.value = true
  infoTab.value = 'basic'
}

function addDuty() {
  if (newDuty.value.trim() && !editForm.duties.includes(newDuty.value.trim())) {
    editForm.duties.push(newDuty.value.trim())
    newDuty.value = ''
  }
}

function toggleTag(tag) {
  const idx = editForm.tags.indexOf(tag)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(tag)
}

function saveProfile() {
  Object.assign(profile, JSON.parse(JSON.stringify(editForm)))
  editing.value = false
  ElMessage.success('商家资料已保存，等待平台审核后更新显示')
}
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
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.gallery-item { text-align: center; }
.gallery-label { font-size: 13px; color: #606266; margin-top: 6px; }
.cases-list { display: flex; flex-direction: column; gap: 12px; }
.case-item { background: #f5f7fa; border-radius: 8px; padding: 12px; }
.case-title { font-weight: 600; margin-bottom: 4px; }
.case-desc { font-size: 13px; color: #606266; margin-bottom: 8px; }
.case-tags { display: flex; flex-wrap: wrap; }
.experts-list { display: flex; flex-direction: column; gap: 12px; }
.expert-item { display: flex; align-items: center; gap: 12px; }
.expert-info { flex: 1; }
.expert-name { font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.expert-desc { font-size: 13px; color: #606266; }
.duty-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 14px; }
.tag-selector { display: flex; flex-wrap: wrap; }
.gallery-edit { display: flex; flex-wrap: wrap; gap: 12px; }
.gallery-edit-item { display: flex; flex-direction: column; align-items: center; }
.gallery-img-placeholder { width: 200px; height: 120px; background: #f5f7fa; border: 1px dashed #dcdfe6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 13px; }
.case-edit-item { background: #f5f7fa; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.expert-edit-item { background: #f5f7fa; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.duties-edit { display: flex; flex-wrap: wrap; align-items: center; }
</style>
