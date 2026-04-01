<template>
  <div class="page"><h2>留言与回复管理</h2>
    <div class="tip-banner">
      <el-icon color="#E6A23C"><Warning /></el-icon>
      留言内容自动过滤手机号、微信号等联系方式，避免双方绕开平台直接联系。含违规信息的留言将标记为"待审核"。
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="需求留言" name="demand">
        <div class="filter-bar">
          <el-input v-model="demandSearch" placeholder="搜索需求名称/留言内容" style="width:260px" clearable />
          <el-select v-model="demandStatusFilter" placeholder="留言状态" style="width:130px">
            <el-option label="全部" value="" /><el-option label="正常" value="正常" /><el-option label="待审核" value="待审核" /><el-option label="已删除" value="已删除" />
          </el-select>
        </div>
        <el-table :data="demandComments" stripe border>
          <el-table-column type="index" width="50" />
          <el-table-column prop="demand" label="所属需求" min-width="160" show-overflow-tooltip />
          <el-table-column prop="commenter" label="留言者" width="130" />
          <el-table-column prop="commenterType" label="身份" width="80">
            <template #default="{ row }"><el-tag :type="row.commenterType==='商家'?'success':'primary'" size="small">{{ row.commenterType }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }"><el-tag :type="row.status==='正常'?'success':row.status==='待审核'?'warning':'danger'" size="small">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewComment(row)">查看</el-button>
              <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveComment(row)">通过</el-button>
              <el-button v-if="row.status!=='已删除'" text type="danger" size="small" @click="deleteComment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="资源留言" name="resource">
        <div class="filter-bar">
          <el-input v-model="resourceSearch" placeholder="搜索资源名称/留言内容" style="width:260px" clearable />
        </div>
        <el-table :data="resourceComments" stripe border>
          <el-table-column type="index" width="50" />
          <el-table-column prop="resource" label="所属资源" min-width="160" show-overflow-tooltip />
          <el-table-column prop="commenter" label="留言者" width="130" />
          <el-table-column prop="commenterType" label="身份" width="80">
            <template #default="{ row }"><el-tag :type="row.commenterType==='商家'?'success':'primary'" size="small">{{ row.commenterType }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }"><el-tag :type="row.status==='正常'?'success':row.status==='待审核'?'warning':'danger'" size="small">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewComment(row)">查看</el-button>
              <el-button v-if="row.status==='待审核'" text type="success" size="small" @click="approveComment(row)">通过</el-button>
              <el-button v-if="row.status!=='已删除'" text type="danger" size="small" @click="deleteComment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 留言详情对话框 -->
    <el-dialog v-model="showDetail" title="留言详情" width="600px" v-if="currentComment">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="留言者">{{ currentComment.commenter }}</el-descriptions-item>
        <el-descriptions-item label="身份">
          <el-tag :type="currentComment.commenterType==='商家'?'success':'primary'" size="small">{{ currentComment.commenterType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="留言时间">{{ currentComment.time }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentComment.status==='正常'?'success':'warning'" size="small">{{ currentComment.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属内容" :span="2">{{ currentComment.demand || currentComment.resource }}</el-descriptions-item>
        <el-descriptions-item label="留言内容" :span="2">
          <div style="white-space:pre-wrap;line-height:1.6">{{ currentComment.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentComment.reply" label="回复内容" :span="2">
          <div style="background:#f5f7fa;padding:8px;border-radius:4px;font-size:13px">
            <strong>{{ currentComment.replyBy }}</strong>：{{ currentComment.reply }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentComment.violations" label="违规检测" :span="2">
          <el-tag type="danger" size="small">检测到可疑联系方式</el-tag>
          <span style="margin-left:8px;font-size:12px;color:#F56C6C">{{ currentComment.violations }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentComment.status==='待审核'" type="success" @click="approveComment(currentComment); showDetail=false">审核通过</el-button>
        <el-button v-if="currentComment.status!=='已删除'" type="danger" @click="deleteComment(currentComment); showDetail=false">删除留言</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const activeTab = ref('demand')
const demandSearch = ref(''), resourceSearch = ref(''), demandStatusFilter = ref('')
const showDetail = ref(false), currentComment = ref(null)

const demandComments = ref([
  { demand: '六一儿童节亲子嘉年华', commenter: '星巴克咖啡', commenterType: '商家', content: '我们对这个活动很感兴趣，可以提供资金和物资支持，品牌理念和活动定位非常契合。', time: '2026-03-28 14:30', status: '正常', reply: '感谢关注，欢迎进一步沟通合作细节！', replyBy: '阳光花园社区', violations: null },
  { demand: '社区广场周末市集', commenter: '中国移动', commenterType: '商家', content: '我们可以提供场地和媒体报道支持，有意向合作请联系', time: '2026-03-30 10:00', status: '待审核', reply: '', replyBy: '', violations: '疑似包含联系方式（已自动打码）' },
  { demand: '老年人心理健康讲座', commenter: '幸福里社区', commenterType: '社区', content: '请问专家是否可以提前到场勘察活动场地？', time: '2026-04-01 09:00', status: '正常', reply: '', replyBy: '', violations: null }
])

const resourceComments = ref([
  { resource: '京东健康义诊服务', commenter: '幸福里社区', commenterType: '社区', content: '我们社区正在筹备健康活动，老年人群体很多，希望能安排义诊合作。', time: '2026-03-29 09:15', status: '正常', reply: '好的，可以安排，请通过平台发起合作意向！', replyBy: '京东健康', violations: null }
])

function viewComment(row) { currentComment.value = row; showDetail.value = true }

function approveComment(row) {
  ElMessageBox.confirm('确认该留言通过审核？', '审核确认', { type: 'success' })
    .then(() => { row.status = '正常'; ElMessage.success('留言已审核通过') }).catch(() => {})
}

function deleteComment(row) {
  ElMessageBox.confirm('确认删除该留言？删除后不可恢复。', '删除确认', { type: 'warning' })
    .then(() => { row.status = '已删除'; ElMessage.success('已删除') }).catch(() => {})
}
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 12px; font-size: 22px; font-weight: 700; }
.tip-banner { background: #fff8e1; border: 1px solid #ffe58f; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: #E6A23C; font-size: 13px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
</style>
