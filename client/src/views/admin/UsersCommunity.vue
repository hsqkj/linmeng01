<template>
  <div class="users-page">
    <h2>社区工作者管理</h2>
    <div class="filter-bar">
      <el-input v-model="search" placeholder="搜索社区名称/姓名" style="width:240px" clearable />
      <el-select v-model="filterDistrict" placeholder="所属街道" style="width:140px" clearable>
        <el-option label="全部" value="" />
        <el-option label="花木街道" value="花木街道" />
        <el-option label="张江镇" value="张江镇" />
        <el-option label="陆家嘴街道" value="陆家嘴街道" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="审核状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="待审核" value="待审核" /><el-option label="已通过" value="已通过" /><el-option label="已禁用" value="已禁用" />
      </el-select>
    </div>
    <el-table :data="filteredUsers" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="name" label="姓名" width="90" />
      <el-table-column prop="community" label="所属社区" min-width="150" />
      <el-table-column prop="district" label="所属街道" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="households" label="户数" width="80" align="center" />
      <el-table-column prop="demands" label="发布需求" width="80" align="center" />
      <el-table-column prop="matchings" label="撮合成功" width="80" align="center" />
      <el-table-column prop="registerTime" label="注册时间" width="150" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status==='已通过'?'success':row.status==='已禁用'?'danger':'warning'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewUser(row)">详情</el-button>
          <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveUser(row)">通过</el-button>
          <el-button v-if="row.status!=='已禁用'" text type="danger" size="small" @click="disableUser(row)">禁用</el-button>
          <el-button v-else text type="success" size="small" @click="enableUser(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="42" :page-size="10" /></div>

    <!-- 社区详细信息对话框 -->
    <el-dialog v-model="showDetail" title="社区工作者详细信息" width="800px" v-if="currentUser">
      <el-tabs v-model="detailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ currentUser.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
            <el-descriptions-item label="社区名称" :span="2">{{ currentUser.community }}</el-descriptions-item>
            <el-descriptions-item label="所属街道">{{ currentUser.district }}</el-descriptions-item>
            <el-descriptions-item label="所属行政区">浦东新区</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentUser.registerTime }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="currentUser.status==='已通过'?'success':'warning'" size="small">{{ currentUser.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="社区画像" name="portrait">
          <el-descriptions :column="2" border title="基础数据">
            <el-descriptions-item label="小区名称">{{ currentUser.communityDetail?.estateName || '阳光花园小区' }}</el-descriptions-item>
            <el-descriptions-item label="小区总户数">{{ currentUser.households }}户</el-descriptions-item>
            <el-descriptions-item label="亲子家庭占比">{{ currentUser.communityDetail?.parentKidRatio || '35%' }}</el-descriptions-item>
            <el-descriptions-item label="老年群体占比">{{ currentUser.communityDetail?.elderRatio || '28%' }}</el-descriptions-item>
            <el-descriptions-item label="社区公共空间面积">{{ currentUser.communityDetail?.publicArea || '2000㎡' }}</el-descriptions-item>
            <el-descriptions-item label="社区商户数">{{ currentUser.communityDetail?.merchantCount || '80家' }}</el-descriptions-item>
          </el-descriptions>
          <el-descriptions :column="2" border title="配套设施" style="margin-top:16px">
            <el-descriptions-item label="户外广场">{{ currentUser.communityDetail?.outdoorSquare || '有，约800㎡，可举办大型活动' }}</el-descriptions-item>
            <el-descriptions-item label="商业体/商业街">{{ currentUser.communityDetail?.commercial || '有，花木商业街' }}</el-descriptions-item>
            <el-descriptions-item label="学校/幼儿园">{{ currentUser.communityDetail?.school || '有（幼儿园1所、小学1所）' }}</el-descriptions-item>
            <el-descriptions-item label="公园/体育场馆">{{ currentUser.communityDetail?.park || '有，社区公园1处、健身广场1处' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="发布记录" name="records">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="发布需求数">{{ currentUser.demands }}条</el-descriptions-item>
            <el-descriptions-item label="撮合成功数">{{ currentUser.matchings }}次</el-descriptions-item>
            <el-descriptions-item label="获得奖励">{{ currentUser.matchings * 200 }}元物资</el-descriptions-item>
          </el-descriptions>
          <el-empty v-if="!currentUser.demands" description="暂无发布记录" style="margin-top:20px" />
          <div v-else style="margin-top:16px">
            <el-table :data="demandRecords" border size="small">
              <el-table-column prop="name" label="需求名称" min-width="160" />
              <el-table-column prop="type" label="类型" width="90"><template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template></el-table-column>
              <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status==='已撮合'?'success':'primary'" size="small">{{ row.status }}</el-tag></template></el-table-column>
              <el-table-column prop="time" label="发布时间" width="150" />
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="标签" name="tags">
          <div class="tags-section">
            <p style="color:#909399;font-size:13px;margin-bottom:12px">社区选择的标签，影响智能匹配精准度</p>
            <div class="tag-list">
              <el-tag v-for="tag in (currentUser.communityDetail?.tags || ['亲子友好','老年服务','健康社区','文化活动','体育赛事','教育资源'])" :key="tag" style="margin:4px">{{ tag }}</el-tag>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentUser.status==='待审核'" type="success" @click="approveUser(currentUser); showDetail=false">通过审核</el-button>
        <el-button v-if="currentUser.status!=='已禁用'" type="danger" @click="disableUser(currentUser); showDetail=false">禁用账号</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const search = ref(''), filterDistrict = ref(''), filterStatus = ref('')
const showDetail = ref(false), currentUser = ref(null), detailTab = ref('basic')

const users = reactive([
  {
    name: '张主任', community: '阳光花园社区', district: '花木街道', phone: '138****1234', households: 1500,
    demands: 8, matchings: 5, registerTime: '2026-01-10 09:00', status: '已通过',
    communityDetail: {
      estateName: '阳光花园小区', parentKidRatio: '38%', elderRatio: '25%', publicArea: '3500㎡',
      merchantCount: '120家', outdoorSquare: '有，约1200㎡，可举办大型活动', commercial: '有，花木商业街',
      school: '有（幼儿园2所、小学1所、中学1所）', park: '有，社区公园2处、健身步道500米',
      tags: ['亲子友好', '老年服务', '文化活动', '体育赛事', '教育资源', '健康社区']
    }
  },
  {
    name: '李社工', community: '幸福里社区', district: '花木街道', phone: '139****5678', households: 1200,
    demands: 5, matchings: 3, registerTime: '2026-01-15 10:30', status: '已通过',
    communityDetail: {
      estateName: '幸福里小区', parentKidRatio: '30%', elderRatio: '35%', publicArea: '2000㎡',
      merchantCount: '80家', outdoorSquare: '有，约600㎡', commercial: '无', school: '有（幼儿园1所）',
      park: '有，社区公园1处',
      tags: ['老年服务', '健康社区', '公益活动']
    }
  },
  {
    name: '王书记', community: '翠竹苑社区', district: '张江镇', phone: '135****9012', households: 900,
    demands: 6, matchings: 4, registerTime: '2026-02-20 14:00', status: '已通过',
    communityDetail: {
      estateName: '翠竹苑小区', parentKidRatio: '45%', elderRatio: '20%', publicArea: '1800㎡',
      merchantCount: '60家', outdoorSquare: '有，约400㎡', commercial: '有，张江科技城商业区',
      school: '有（幼儿园1所、小学1所、大学1所）', park: '有，张江公园',
      tags: ['科技创新', '亲子友好', '教育资源', '文化活动']
    }
  },
  {
    name: '赵干事', community: '新华里社区', district: '陆家嘴街道', phone: '136****3456', households: 600,
    demands: 2, matchings: 1, registerTime: '2026-03-28 16:00', status: '待审核',
    communityDetail: {
      estateName: '新华里小区', parentKidRatio: '25%', elderRatio: '40%', publicArea: '1200㎡',
      merchantCount: '40家', outdoorSquare: '无', commercial: '有，陆家嘴金融商业区',
      school: '有（幼儿园1所）', park: '无',
      tags: ['老年服务', '金融教育']
    }
  }
])

const demandRecords = [
  { name: '六一儿童节亲子嘉年华', type: '活动赞助', status: '进行中', time: '2026-03-28 09:00' },
  { name: '老年人心理健康讲座', type: '专家服务', status: '已撮合', time: '2026-03-10 10:00' },
  { name: '社区广场运营合作', type: '空间运营', status: '审核中', time: '2026-04-01 14:00' }
]

const filteredUsers = computed(() => {
  return users.filter(u => {
    const matchSearch = !search.value || u.name.includes(search.value) || u.community.includes(search.value)
    const matchDistrict = !filterDistrict.value || u.district === filterDistrict.value
    const matchStatus = !filterStatus.value || u.status === filterStatus.value
    return matchSearch && matchDistrict && matchStatus
  })
})

function viewUser(row) { currentUser.value = row; detailTab.value = 'basic'; showDetail.value = true }

function approveUser(row) {
  ElMessageBox.confirm('确认通过该社区工作者的注册审核？', '审核确认', { type: 'success', confirmButtonText: '确认通过', cancelButtonText: '取消' })
    .then(() => { row.status = '已通过'; ElMessage.success('已通过审核') })
    .catch(() => {})
}

function disableUser(row) {
  ElMessageBox.confirm(`确认禁用"${row.name}"（${row.community}）的账号？禁用后该用户将无法登录平台。`, '禁用确认', {
    type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger'
  }).then(() => { row.status = '已禁用'; ElMessage.success('已禁用') }).catch(() => {})
}

function enableUser(row) {
  ElMessageBox.confirm(`确认恢复"${row.name}"的账号？`, '恢复确认', { type: 'info' })
    .then(() => { row.status = '已通过'; ElMessage.success('账号已恢复') }).catch(() => {})
}
</script>
<style scoped>
.users-page { max-width: 1200px; margin: 0 auto; }
.users-page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.tags-section { padding: 8px 0; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
