<template>
  <div class="page"><h2>撮合管理</h2>
    <div class="stats-row">
      <div class="sc" v-for="s in stats" :key="s.label"><div class="sv" :style="{color:s.color}">{{ s.value }}</div><div class="sl">{{ s.label }}</div></div>
    </div>
    <div class="filter-bar">
      <el-input v-model="searchKey" placeholder="搜索需求名称/商家/社区" style="width:220px" clearable />
      <el-select v-model="filterStatus" placeholder="状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="进行中" value="进行中" /><el-option label="已完成" value="已完成" />
      </el-select>
      <el-select v-model="filterReward" placeholder="奖励状态" style="width:130px">
        <el-option label="全部" value="" /><el-option label="待发放" value="待发放" /><el-option label="已发放" value="已发放" />
      </el-select>
    </div>
    <el-table :data="matchings" stripe border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="demand" label="需求名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="community" label="社区" width="130" />
      <el-table-column prop="merchant" label="商家" width="130" />
      <el-table-column prop="resource" label="提供资源" width="130" />
      <el-table-column prop="time" label="撮合时间" width="150" />
      <el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status==='已完成'?'success':'primary'" size="small">{{ row.status }}</el-tag></template></el-table-column>
      <el-table-column prop="reward" label="奖励状态" width="100"><template #default="{ row }"><el-tag :type="row.reward==='已发放'?'success':'warning'" size="small">{{ row.reward }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button text type="success" size="small" v-if="row.reward==='待发放'" @click="grantReward(row)">发放奖励</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination"><el-pagination layout="prev,pager,next,total" :total="45" :page-size="10" /></div>

    <!-- 撮合详情对话框 -->
    <el-dialog v-model="showDetail" title="撮合详情" width="700px" v-if="currentMatching">
      <el-descriptions :column="2" border title="撮合信息">
        <el-descriptions-item label="需求名称" :span="2">{{ currentMatching.demand }}</el-descriptions-item>
        <el-descriptions-item label="社区方">{{ currentMatching.community }}</el-descriptions-item>
        <el-descriptions-item label="商家方">{{ currentMatching.merchant }}</el-descriptions-item>
        <el-descriptions-item label="商家会员等级">{{ currentMatching.merchantLevel || '金牌会员' }}</el-descriptions-item>
        <el-descriptions-item label="提供资源">{{ currentMatching.resource }}</el-descriptions-item>
        <el-descriptions-item label="撮合时间">{{ currentMatching.time }}</el-descriptions-item>
        <el-descriptions-item label="撮合状态">
          <el-tag :type="currentMatching.status==='已完成'?'success':'primary'" size="small">{{ currentMatching.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentMatching.finishTime || '进行中' }}</el-descriptions-item>
        <el-descriptions-item label="匹配度">
          <span style="color:#f56c6c">{{ '❤️'.repeat(currentMatching.matchScore || 4) }}{{ '🤍'.repeat(5 - (currentMatching.matchScore || 4)) }}</span>
          <span style="color:#909399;font-size:12px;margin-left:4px">（{{ (currentMatching.matchScore || 4) * 20 }}%）</span>
        </el-descriptions-item>
        <el-descriptions-item label="撮合奖励">
          <el-tag :type="currentMatching.reward==='已发放'?'success':'warning'" size="small">{{ currentMatching.reward }}</el-tag>
          <span style="margin-left:8px;font-size:13px;color:#606266">¥200元物资（捐赠给社区）</span>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top:16px">
        <div style="font-weight:600;margin-bottom:8px;font-size:14px">撮合过程记录</div>
        <el-timeline>
          <el-timeline-item timestamp="2026-03-25 10:00" placement="top" type="primary">商家"{{ currentMatching.merchant }}"查看需求，发起合作意向</el-timeline-item>
          <el-timeline-item timestamp="2026-03-26 14:30" placement="top" type="success">社区"{{ currentMatching.community }}"接受合作意向</el-timeline-item>
          <el-timeline-item :timestamp="currentMatching.time" placement="top" type="warning">平台确认撮合成功</el-timeline-item>
          <el-timeline-item v-if="currentMatching.status==='已完成'" :timestamp="currentMatching.finishTime" placement="top" type="success">合作完成</el-timeline-item>
        </el-timeline>
      </div>

      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button v-if="currentMatching.reward==='待发放'" type="success" @click="grantReward(currentMatching); showDetail=false">发放奖励</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const filterStatus = ref(''), filterReward = ref(''), searchKey = ref('')
const showDetail = ref(false), currentMatching = ref(null)

const stats = [
  { label: '累计撮合', value: '45次', color: '#409EFF' },
  { label: '成功撮合', value: '38次', color: '#67C23A' },
  { label: '本月新增', value: '8次', color: '#E6A23C' },
  { label: '待发放奖励', value: '5笔', color: '#F56C6C' }
]
const matchings = reactive([
  { demand: '六一儿童节亲子嘉年华', community: '阳光花园', merchant: '星巴克咖啡', merchantLevel: '金牌会员', resource: '资金5万+物资', time: '2026-03-28 14:30', status: '进行中', reward: '待发放', matchScore: 5, finishTime: '' },
  { demand: '春节联欢晚会', community: '阳光花园', merchant: '华润万家', merchantLevel: '金牌会员', resource: '物资2万元', time: '2026-01-15 10:00', status: '已完成', reward: '已发放', matchScore: 4, finishTime: '2026-02-05 16:00' },
  { demand: '青少年编程课', community: '幸福里', merchant: '新东方', merchantLevel: '铂金会员', resource: '课程+师资', time: '2026-02-20 09:00', status: '已完成', reward: '已发放', matchScore: 5, finishTime: '2026-03-30 17:00' },
  { demand: '三八妇女节活动', community: '翠竹苑', merchant: '平安保险', merchantLevel: '银牌会员', resource: '资金1万+讲座', time: '2026-03-08 08:30', status: '已完成', reward: '已发放', matchScore: 3, finishTime: '2026-03-10 18:00' }
])

function viewDetail(row) { currentMatching.value = row; showDetail.value = true }

function grantReward(row) {
  ElMessageBox.confirm(
    `确认向"${row.community}"社区发放撮合奖励？\n\n奖励标准：¥200元等值物资\n受益社区：${row.community}\n撮合项目：${row.demand}`,
    '发放奖励确认',
    { type: 'success', confirmButtonText: '确认发放', cancelButtonText: '取消', dangerouslyUseHTMLString: false }
  ).then(() => {
    row.reward = '已发放'
    ElMessage.success('奖励已发放！¥200元物资将捐赠给 ' + row.community)
  }).catch(() => {})
}
</script>
<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.page h2 { margin-bottom: 16px; font-size: 22px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.sc { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
.sv { font-size: 28px; font-weight: 700; }
.sl { font-size: 13px; color: #909399; margin-top: 4px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
