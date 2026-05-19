<template>
  <div class="demand-detail">
    <div v-loading="loading" element-loading-text="加载中...">
      <div class="page-header">
        <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回需求大厅</el-button>
      </div>

      <div class="detail-layout" v-if="demand">
        <!-- 左侧主内容 -->
        <div class="main-content">
          <div class="demand-card">
            <div class="demand-header">
              <div class="demand-meta">
                <el-tag type="primary" size="large" effect="dark">{{ demandTypeName }}</el-tag>
                <el-tag type="info" size="small" style="margin-left:8px">{{ demand.location_type === '室外' ? '🌳' : '🏠' }} {{ demand.location_type }}活动</el-tag>
                <span class="match-hearts" title="匹配度">{{ '❤️'.repeat(demand.matchHearts || 0) }}{{ '🤍'.repeat(5 - (demand.matchHearts || 0)) }}</span>
              </div>
              <h1 class="demand-title">{{ demand.title }}</h1>
              <div class="community-info">
                <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(demand.community_name)}&background=4A90D9&color=fff`" class="community-avatar" />
                <div>
                  <div class="community-name" style="cursor:pointer;color:#409EFF" @click="loadCommunityDetail">{{ demand.community_name }}</div>
                  <div class="community-addr">{{ demand.district }}{{ demand.street ? ' · ' + demand.street : '' }}</div>
                </div>
              </div>
            </div>

            <el-divider />

            <!-- 活动基本信息 -->
            <div class="section">
              <h3>📋 活动基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">活动类型</span>
                  <span class="info-value">{{ demandTypeName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">目标对象</span>
                  <span class="info-value">
                    <el-tag v-for="g in parseTargetAudience(demand.target_audience)" :key="g" size="small" type="warning" style="margin:2px">{{ g }}</el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">活动时间</span>
                  <span class="info-value">{{ formatDateTime(demand.start_time) || formatDateTime(demand.end_time) ? (formatDateTime(demand.start_time) + ' 至 ' + formatDateTime(demand.end_time)) : '待定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">活动地点</span>
                  <span class="info-value">{{ demand.location_type === '室外' ? '🌳' : '🏠' }} {{ demand.location || '待定' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">预计参与</span>
                  <span class="info-value">约 {{ demand.expected_audience || 0 }} 人</span>
                </div>
                <div class="info-item">
                  <span class="info-label">截止日期</span>
                  <span class="info-value deadline">{{ formatDateTime(demand.deadline) || '长期有效' }}</span>
                </div>
              </div>
            </div>

            <!-- 活动简介 -->
            <div class="section">
              <h3>📝 活动简介</h3>
              <p class="description">{{ demand.description || '暂无简介' }}</p>
            </div>

            <!-- 所需赞助 -->
            <div class="section">
              <h3>🎯 所需赞助</h3>
              <div class="sponsor-blocks">
                <div v-if="demand.fund_amount" class="sponsor-block fund">
                  <div class="sblock-title">💵 资金赞助</div>
                  <div class="sblock-desc">所需金额：{{ demand.fund_amount }}<br v-if="demand.fund_usage">用途：{{ demand.fund_usage }}</div>
                </div>
                <div v-if="demand.goods_list" class="sponsor-block goods">
                  <div class="sblock-title">📦 物资赞助</div>
                  <div class="sblock-desc">{{ demand.goods_list }}</div>
                </div>
                <div v-if="demand.manpower_need" class="sponsor-block manpower">
                  <div class="sblock-title">👥 人力支持</div>
                  <div class="sblock-desc">{{ demand.manpower_need }}</div>
                </div>
              </div>
            </div>

            <!-- 商家回报 - 重点展示 -->
            <div class="section reward-section">
              <h3>🏆 商家回报（赞助后您将获得）</h3>
              <div class="reward-grid">
                <div class="reward-item" v-for="r in parseRewards(demand.merchant_reward)" :key="r.title">
                  <div class="reward-icon">{{ r.icon }}</div>
                  <div class="reward-text">
                    <div class="reward-title">{{ r.title }}</div>
                    <div class="reward-desc">{{ r.desc }}</div>
                  </div>
                </div>
              </div>
              <div class="reward-value" v-if="demand.reward_details">
                <el-icon color="#E6A23C"><InfoFilled /></el-icon>
                <strong>回报价值说明：</strong>{{ demand.reward_details }}
              </div>
            </div>

            <!-- 标签 -->
            <div class="section">
              <h3>🏷️ 需求标签</h3>
              <el-tag v-for="tag in parseTags(demand.tags)" :key="tag" type="primary" effect="light" style="margin:4px">{{ tag }}</el-tag>
              <span v-if="!demand.tags || parseTags(demand.tags).length === 0" style="color:#909399;font-size:13px">暂无标签</span>
            </div>

            <!-- 留言区（Lv0 不可查看） -->
            <div class="section" v-if="memberLevel > 0">
              <h3>💬 留言与咨询（{{ commentList.length }}条）</h3>
              <div class="comment-input" id="comment-area">
                <el-input v-model="commentText" placeholder="有意向合作？可以在这里留言咨询..." type="textarea" :rows="3" />
                <el-button type="primary" @click="submitComment" style="margin-top:8px" :loading="commentSubmitting">发送留言</el-button>
              </div>
              <div class="comment-list" v-if="commentList.length">
                <div class="comment-item" v-for="c in commentList" :key="c.id">
                  <img :src="c.user_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_name || '用户')}&background=4A90D9&color=fff`" class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-meta">
                      <span class="commenter-name">{{ c.user_name || '商家用户' }}</span>
                      <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                    </div>
                    <div class="comment-text">{{ c.content }}</div>
                    <div class="comment-replies" v-if="c.replies && c.replies.length">
                      <div class="reply-item" v-for="r in c.replies" :key="r.id">
                        <strong>{{ r.user_name }}：</strong>{{ r.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无留言" :image-size="60" />
            </div>
            <!-- 留言区权限提示 -->
            <div class="section" v-else>
              <div class="lock-notice">
                <el-icon :size="28"><Lock /></el-icon>
                <p>留言与咨询功能需升级会员后使用</p>
                <el-button type="primary" size="small" @click="$router.push('/merchant/member')">升级会员</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：社区信息 + 操作 -->
        <div class="side-content">
          <!-- 操作卡 -->
          <div class="action-card">
            <div class="match-score">
              <div class="hearts">{{ '❤️'.repeat(demand.matchHearts || 0) }}{{ '🤍'.repeat(5 - (demand.matchHearts || 0)) }}</div>
              <div class="score-label">匹配度 {{ (demand.matchHearts || 0) * 20 }}%</div>
            </div>
            <div class="action-btns-primary">
              <el-button type="primary" @click="showIntentDialog = true" style="flex:1">
                🤝 提供赞助
              </el-button>
              <el-button v-if="memberLevel > 0" @click="scrollToComment">
                💬 咨询
              </el-button>
              <el-button :type="isFavorited ? 'warning' : 'default'" :loading="favoriteLoading" @click="toggleFav">
                {{ isFavorited ? '⭐' : '☆' }}
              </el-button>
            </div>
            <div class="deadline-tip">
              <el-icon color="#F56C6C"><Warning /></el-icon>
              截止 {{ formatDateTime(demand.deadline) || '长期有效' }}，还有 <strong style="color:#F56C6C">{{ getDaysLeft(demand.deadline) }}天</strong>
            </div>
          </div>

          <!-- 社区概况 -->
          <div class="community-card">
            <h4>🏘️ 社区概况</h4>
            <div class="community-stats" v-if="communityDetail">
              <div class="stat-item"><span class="stat-val">{{ communityDetail.households || 0 }}</span><span class="stat-lab">户数</span></div>
              <div class="stat-item"><span class="stat-val">{{ communityDetail.family_ratio || '-' }}</span><span class="stat-lab">亲子家庭</span></div>
              <div class="stat-item"><span class="stat-val">{{ communityDetail.elderly_ratio || '-' }}</span><span class="stat-lab">老年群体</span></div>
            </div>
            <div class="community-features" v-if="communityDetail">
              <el-tag v-if="communityDetail.has_outdoor_plaza" size="small" type="info" effect="light" style="margin:3px">有户外广场</el-tag>
              <el-tag v-if="communityDetail.has_school" size="small" type="info" effect="light" style="margin:3px">有幼儿园/小学</el-tag>
              <el-tag v-if="communityDetail.has_commercial" size="small" type="info" effect="light" style="margin:3px">有商业体</el-tag>
              <el-tag v-if="communityDetail.has_park" size="small" type="info" effect="light" style="margin:3px">有公园</el-tag>
            </div>
            <div class="contact-info" v-if="memberLevel > 0">
              <div><el-icon><User /></el-icon> 联系人：{{ demand.contact_name || '暂无' }}</div>
              <div><el-icon><Message /></el-icon> 合作请联系通过平台发起意向</div>
            </div>
          </div>

          <!-- 联系方式（金牌会员可见） -->
          <div class="contact-card" v-if="demand.canViewContact && demand.address">
            <h4>🔒 联系方式（金牌会员可见）</h4>
            <div class="contact-detail">
              <div><el-icon><Phone /></el-icon> {{ demand.contact_phone || '暂无' }}</div>
              <div><el-icon><Location /></el-icon> {{ demand.address }}</div>
            </div>
          </div>
          <div class="contact-card" v-else-if="!demand.canViewContact">
            <div style="text-align:center;padding:12px;color:#909399">
              <el-icon :size="32"><Lock /></el-icon>
              <p style="margin:8px 0 4px;font-size:13px">联系方式仅对金牌及以上会员可见</p>
              <el-button size="small" type="primary" @click="$router.push('/merchant/member')">升级会员</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 社区详情弹窗 -->
      <el-dialog v-model="showCommunityDialog" title="社区基本信息" width="680px">
        <div class="community-detail-content" v-if="communityDetail">
          <div class="detail-header">
            <img :src="communityDetail.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(communityDetail.community_name)}&background=4A90D9&color=fff`" class="detail-avatar" />
            <div class="detail-info">
              <div class="detail-name">{{ communityDetail.community_name }}</div>
              <div class="detail-addr">{{ communityDetail.district }} {{ communityDetail.street }}</div>
            </div>
          </div>
          <el-divider />
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="户数规模">{{ communityDetail.households || '未知' }} 户</el-descriptions-item>
            <el-descriptions-item label="商户数量">{{ communityDetail.merchant_count || '未知' }} 家</el-descriptions-item>
            <el-descriptions-item label="亲子家庭">{{ communityDetail.family_ratio || '-' }}%</el-descriptions-item>
            <el-descriptions-item label="老年群体">{{ communityDetail.elderly_ratio || '-' }}%</el-descriptions-item>
            <el-descriptions-item label="公共空间">{{ communityDetail.public_space_area ? communityDetail.public_space_area + '㎡' : '-' }}</el-descriptions-item>
          </el-descriptions>
          <div class="detail-tags" style="margin-top:16px">
            <div style="font-weight:600;margin-bottom:8px">社区特点</div>
            <el-tag v-if="communityDetail.has_outdoor_plaza" size="small" type="info" effect="light" style="margin:3px">有户外广场</el-tag>
            <el-tag v-if="communityDetail.has_school" size="small" type="info" effect="light" style="margin:3px">有幼儿园/小学</el-tag>
            <el-tag v-if="communityDetail.has_commercial" size="small" type="info" effect="light" style="margin:3px">有商业体</el-tag>
            <el-tag v-if="communityDetail.has_park" size="small" type="info" effect="light" style="margin:3px">有公园</el-tag>
            <el-tag v-if="communityDetail.description" size="small" type="info" effect="light" style="margin:3px">{{ communityDetail.description }}</el-tag>
          </div>
          <div class="detail-tags" style="margin-top:16px" v-if="communityDetail.tags">
            <div style="font-weight:600;margin-bottom:8px">社区标签</div>
            <el-tag v-for="tag in (Array.isArray(communityDetail.tags) ? communityDetail.tags : communityDetail.tags.split(','))" :key="tag" size="small" type="primary" effect="light" style="margin:3px">{{ tag }}</el-tag>
          </div>
          
          <!-- 简介 -->
          <div v-if="communityDetail.description" style="margin-top:16px">
            <div style="font-weight:600;margin-bottom:8px">社区简介</div>
            <div style="color:#606266;font-size:14px;line-height:1.6">{{ communityDetail.description }}</div>
          </div>
          
          <!-- 证明材料图片 -->
          <div v-if="communityDetail.proof_images && communityDetail.proof_images.length > 0" style="margin-top:16px">
            <div style="font-weight:600;margin-bottom:8px">📄 证明材料</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <el-image
                v-for="(img, idx) in (Array.isArray(communityDetail.proof_images) ? communityDetail.proof_images : JSON.parse(communityDetail.proof_images || '[]'))"
                :key="idx"
                :src="img"
                style="width:80px;height:80px;object-fit:cover;border-radius:4px;"
                :preview-src-list="(Array.isArray(communityDetail.proof_images) ? communityDetail.proof_images : JSON.parse(communityDetail.proof_images || '[]'))"
                fit="cover"
              />
            </div>
          </div>
          
          <!-- 社区图片 -->
          <div v-if="communityDetail.images && communityDetail.images.length > 0" style="margin-top:16px">
            <div style="font-weight:600;margin-bottom:8px">📷 社区图片</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              <el-image
                v-for="(img, idx) in (Array.isArray(communityDetail.images) ? communityDetail.images : JSON.parse(communityDetail.images || '[]'))"
                :key="idx"
                :src="img"
                style="width:100px;height:100px;object-fit:cover;border-radius:4px;"
                :preview-src-list="(Array.isArray(communityDetail.images) ? communityDetail.images : JSON.parse(communityDetail.images || '[]'))"
                fit="cover"
              />
            </div>
          </div>

          <!-- 小区信息 -->
          <div v-if="communityDetail.compounds && communityDetail.compounds.length > 0" style="margin-top:20px">
            <div style="font-weight:600;margin-bottom:8px">🏠 所辖小区</div>
            <el-table :data="communityDetail.compounds" size="small" border>
              <el-table-column prop="name" label="小区名称" />
              <el-table-column prop="households" label="户数" width="100" />
            </el-table>
          </div>

          <!-- 场地空间信息 -->
          <div v-if="communityDetail.spaces && communityDetail.spaces.length > 0" style="margin-top:20px">
            <div style="font-weight:600;margin-bottom:8px">🏟️ 场地空间</div>
            <div class="detail-spaces">
              <div v-for="space in communityDetail.spaces" :key="space.id" class="detail-space-item">
                <div class="space-title">{{ space.name }}</div>
                <div class="space-meta">
                  <el-tag size="small" :type="space.location_type === 0 ? 'primary' : 'success'">
                    {{ space.location_type === 0 ? '室内' : '室外' }}
                  </el-tag>
                  <span v-if="space.location_type === 0 && space.floor_number">{{ space.floor_number }}层</span>
                  <span v-if="space.area">面积：{{ space.area }}㎡</span>
                  <span v-if="space.capacity">容纳：{{ space.capacity }}人</span>
                </div>
                <div v-if="space.facilities && space.facilities.length > 0" class="space-facilities">
                  <el-tag v-for="f in space.facilities" :key="f" size="small" style="margin:2px">{{ f }}</el-tag>
                </div>
                <div v-if="space.available_hours" class="space-hours">可用：{{ space.available_hours }}</div>
                <div v-if="space.images && space.images.length > 0" class="space-images">
                  <el-image
                    v-for="(img, idx) in space.images"
                    :key="idx"
                    :src="img"
                    style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 6px;"
                    :preview-src-list="space.images"
                    fit="cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;padding:40px;color:#909399">
          <el-icon :size="40"><Loading /></el-icon>
        </div>
      </el-dialog>

      <!-- 发起意向弹窗 -->
      <el-dialog v-model="showIntentDialog" title="发起赞助意向" width="500px">
        <el-form label-position="top">
          <el-form-item label="选择提供的赞助类型">
            <el-checkbox-group v-model="intentTypes">
              <el-checkbox label="fund">💵 资金赞助</el-checkbox>
              <el-checkbox label="goods">📦 物资提供</el-checkbox>
              <el-checkbox label="manpower">👥 人力支持</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="意向说明">
            <el-input v-model="intentDesc" type="textarea" :rows="4" placeholder="请简要说明您可以提供的资源规模和期望的合作形式..." />
          </el-form-item>
          <div style="color:#909399;font-size:12px">
            提交后，社区工作者将收到您的意向通知并决定是否接受。
          </div>
        </el-form>
        <template #footer>
          <el-button @click="showIntentDialog = false">取消</el-button>
          <el-button type="primary" @click="submitIntent" :loading="intentSubmitting">提交意向</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requireAuth } from '@/utils/useAuth'
import { ArrowLeft, InfoFilled, Warning, Lock, Phone, Message, User, Location, Loading } from '@element-plus/icons-vue'
import { getDemandDetail, getDemandComments, createDemandComment, getCommentReplies, createIntention, getCommunityDetail, toggleFavorite, getPublishTypes } from '@/api/merchant'

const route = useRoute()
const loading = ref(true)
const demand = ref(null)
const commentText = ref('')
const commentSubmitting = ref(false)
const commentList = ref([])
const showIntentDialog = ref(false)
const showCommentInput = ref(false)
const showCommunityDialog = ref(false)
const intentTypes = ref([])
const intentDesc = ref('')
const intentSubmitting = ref(false)
const communityDetail = ref(null)
const isFavorited = ref(false)
const favoriteLoading = ref(false)
const memberLevel = ref(0)

// 从 localStorage 获取会员等级
const storedMerchant = JSON.parse(localStorage.getItem('merchant_info') || '{}')
memberLevel.value = storedMerchant.member_level || 0

// 需求类型映射（从API动态加载）
const demandTypeMap = ref({})
const demandTypeName = computed(() => {
  const type = demand.value?.demand_type
  if (!type && type !== 0) return '需求'
  // 后端可能返回对象数组 {id,name}，也可能返回字符串数组
  const name = demandTypeMap.value[type]
  if (name) return name
  // 兜底：用 demand_type_name
  return demand.value?.demand_type_name ?? String(type)
})
// 加载需求类型配置
async function loadDemandTypes() {
  try {
    const res = await getPublishTypes()
    if (res.data?.demand_types?.length) {
      const map = {}
      res.data.demand_types.forEach((item, idx) => {
        const name = (typeof item === 'object' && item !== null) ? item.name : item
        const id = (typeof item === 'object' && item !== null) ? item.id : idx
        map[id] = name
        map[name] = name
      })
      demandTypeMap.value = map
    }
  } catch {}
}

function parseRewards(reward) {
  if (!reward) return []
  // merchant_reward 字段可能是数组或逗号分隔的字符串
  const rewards = Array.isArray(reward) ? reward : reward.split(',').filter(Boolean)
  const iconMap = {
    '冠名权': '🏅', '展台': '🎪', '展位': '🎪', '口播': '🎤', 'Logo': '📺',
    '群推送': '📣', '荣誉证书': '🏆', '推文': '📰', '宣传栏': '📌',
    '背景板': '📺', '公众号': '📰', '广播': '📣'
  }
  return rewards.map((r, i) => {
    let icon = '🎁'
    for (const [key, val] of Object.entries(iconMap)) {
      if (r.includes(key)) { icon = val; break }
    }
    return { icon, title: r.trim(), desc: '详见回报价值说明' }
  })
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 格式化日期时间（去掉秒，如 "2026-05-15 9:00"）
function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 目标对象映射
const targetAudienceMap = { 1: '社区居民', 2: '企业员工', 3: '学生群体', 4: '老年群体', 5: '亲子家庭' }
function parseTargetAudience(val) {
  if (!val) return []
  let arr = val
  if (typeof val === 'string') {
    try { arr = JSON.parse(val) } catch { arr = val.split(',') }
  }
  return arr.map(g => targetAudienceMap[g] || g)
}

// 标签映射
const tagMap = {
  1: '老旧小区', 2: '新建社区', 3: '青年社区', 4: '老龄化社区', 5: '亲子社区',
  6: '学区社区', 7: '商圈社区', 8: '产业园区', 9: '交通枢纽', 10: '景区周边',
  11: '文化社区', 12: '体育社区', 13: '绿色社区', 14: '智慧社区', 15: '志愿社区',
  16: '商业密集', 17: '公共空间丰富', 18: '学校密集', 19: '公园环绕'
}
function parseTags(val) {
  if (!val) return []
  let arr = val
  if (typeof val === 'string') {
    try { arr = JSON.parse(val) } catch { arr = val.split(',') }
  }
  return arr.map(t => tagMap[t] || t)
}

function getDaysLeft(deadline) {
  if (!deadline) return 999
  const now = new Date()
  const end = new Date(deadline)
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

async function loadDemand() {
  try {
    const id = route.params.id
    const res = await getDemandDetail(id)
    demand.value = res.data
    // 同步更新会员等级
    if (res.data?.memberLevel) {
      memberLevel.value = res.data.memberLevel
    }
  } catch (err) {
    if (err?.response?.status === 404) {
      ElMessage.error('需求不存在或已下架')
    } else if (!err?.response) {
      ElMessage.error('加载需求详情失败，请检查网络')
    }
    demand.value = null
  }
}

async function loadComments() {
  try {
    const id = route.params.id
    const res = await getDemandComments(id)
    // 每个留言还需要加载回复
    const list = Array.isArray(res.data) ? res.data : []
    await Promise.allSettled(list.map(async (c) => {
      try {
        const r = await getCommentReplies(c.id)
        c.replies = (r.data || []).map(rep => ({
          id: rep.id,
          user_name: rep.user_name || '用户',
          content: rep.content
        }))
      } catch {
        c.replies = []
      }
    }))
    commentList.value = list
  } catch (err) {
    console.error('加载留言失败', err)
    commentList.value = []
  }
}

async function loadCommunityDetail() {
  if (!demand.value?.community_id) return
  showCommunityDialog.value = true
  try {
    const res = await getCommunityDetail(demand.value.community_id)
    communityDetail.value = res.data
  } catch (err) {
    console.error('加载社区详情失败', err)
  }
}

async function submitComment() {
  if (!localStorage.getItem('merchant_token')) {
    return requireAuth('merchant')
  }
  if (!commentText.value.trim()) return
  commentSubmitting.value = true
  try {
    await createDemandComment(route.params.id, { content: commentText.value })
    commentText.value = ''
    ElMessage.success('留言已发送')
    await loadComments()
  } catch (err) {
    ElMessage.error('留言失败')
  } finally {
    commentSubmitting.value = false
  }
}

async function submitIntent() {
  if (!localStorage.getItem('merchant_token')) {
    return requireAuth('merchant')
  }
  if (!intentTypes.value.length) {
    ElMessage.warning('请至少选择一种赞助类型')
    return
  }
  intentSubmitting.value = true
  try {
    await createIntention({
      demand_id: route.params.id,
      intro: `${intentTypes.value.join(',')}：${intentDesc.value}`
    })
    showIntentDialog.value = false
    intentTypes.value = []
    intentDesc.value = ''
    ElMessage.success('意向已提交！社区工作者将在24小时内回复')
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
  } finally {
    intentSubmitting.value = false
  }
}

function scrollToComment() {
  setTimeout(() => {
    document.querySelector('.comment-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.querySelector('.comment-input textarea')?.focus()
  }, 100)
}

async function toggleFav() {
  if (!localStorage.getItem('merchant_token')) {
    return requireAuth('merchant')
  }
  if (!demand.value) return
  favoriteLoading.value = true
  try {
    const res = await toggleFavorite({ demand_id: demand.value.id })
    isFavorited.value = res.data?.favorited
    ElMessage.success(res.data?.favorited ? '已收藏该需求' : '已取消收藏')
  } catch {
    // error handled by interceptor
  } finally {
    favoriteLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  loadDemandTypes()
  await Promise.allSettled([loadDemand(), loadComments()])
  loading.value = false
})
</script>

<style scoped>
.demand-detail { background: #f5f5f5; padding: 12px 14px 20px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.detail-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
.main-content, .side-content { display: flex; flex-direction: column; gap: 16px; }
.demand-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.demand-header { margin-bottom: 8px; }
.demand-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.match-hearts { margin-left: auto; font-size: 18px; }
.demand-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
.community-info { display: flex; align-items: center; gap: 12px; }
.community-avatar { width: 44px; height: 44px; border-radius: 8px; }
.community-name { font-weight: 600; font-size: 15px; }
.community-addr { font-size: 13px; color: #909399; margin-top: 2px; }
.section { margin-top: 24px; }
.section h3 { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.deadline { color: #F56C6C; font-weight: 500; }
.description { color: #606266; line-height: 1.8; font-size: 14px; }
.sponsor-blocks { display: flex; flex-direction: column; gap: 12px; }
.sponsor-block { border-radius: 8px; padding: 14px; }
.sponsor-block.fund { background: #fff5f5; border-left: 3px solid #F56C6C; }
.sponsor-block.goods { background: #fffbf0; border-left: 3px solid #E6A23C; }
.sponsor-block.manpower { background: #f0fff4; border-left: 3px solid #67C23A; }
.sblock-title { font-weight: 600; margin-bottom: 6px; }
.sblock-desc { font-size: 13px; color: #606266; line-height: 1.8; }
.reward-section { background: linear-gradient(135deg, #fff8e1, #fff); border-radius: 10px; padding: 20px; border: 1px solid #ffd04b; }
.reward-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.reward-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.reward-icon { font-size: 20px; }
.reward-title { font-weight: 600; font-size: 13px; }
.reward-desc { font-size: 12px; color: #909399; margin-top: 2px; }
.reward-value { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #E6A23C; background: #fff8dc; padding: 10px; border-radius: 8px; }
.comment-input { margin-bottom: 20px; }
.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.comment-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.commenter-name { font-weight: 600; font-size: 14px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-text { font-size: 14px; color: #303133; }
.comment-replies { margin-top: 8px; background: #f5f7fa; border-radius: 6px; padding: 8px 12px; }
.reply-item { font-size: 13px; color: #606266; }
.lock-notice { text-align: center; padding: 24px; color: #909399; border: 1px dashed #dcdfe6; border-radius: 8px; }
.lock-notice p { margin: 8px 0; font-size: 14px; }
.action-card, .community-card, .similar-card, .contact-card { background: #fff; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.match-score { text-align: center; margin-bottom: 12px; }
.hearts { font-size: 22px; }
.score-label { font-size: 12px; color: #909399; margin-top: 4px; }
.action-btns-primary { display: flex; gap: 8px; }
.action-btns-primary .el-button { padding: 10px 14px; font-size: 13px; }
.deadline-tip { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #606266; margin-top: 10px; justify-content: center; }
.community-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.stat-item { text-align: center; }
.stat-val { display: block; font-size: 18px; font-weight: 700; color: #409EFF; }
.stat-lab { font-size: 12px; color: #909399; }
.community-card h4, .similar-card h4, .contact-card h4 { margin: 0 0 12px; font-size: 15px; }
.contact-info { margin-top: 8px; font-size: 14px; display: flex; flex-direction: column; gap: 6px; color: #303133; }
.contact-detail { font-size: 14px; display: flex; flex-direction: column; gap: 8px; color: #303133; }
.similar-list { display: flex; flex-direction: column; gap: 10px; }
.similar-item { padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.similar-item:hover { border-color: #409EFF; background: #f0f7ff; }
.sim-title { font-size: 13px; font-weight: 500; }
.sim-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.community-detail-content { padding: 8px 0; }
.detail-header { display: flex; align-items: center; gap: 16px; }
.detail-avatar { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
.detail-info { flex: 1; }
.detail-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
.detail-addr { font-size: 14px; color: #909399; margin-top: 4px; }
.detail-tags { display: flex; flex-wrap: wrap; align-items: center; }

/* 社区详情弹窗中的场地空间样式 */
.detail-spaces {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-space-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}
.detail-space-item .space-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}
.detail-space-item .space-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.detail-space-item .space-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.detail-space-item .space-hours {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.detail-space-item .space-images {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@media (max-width: 768px) {
  .demand-detail {
    padding: 12px;
    padding-bottom: 80px;
  }
  .page-header { margin-bottom: 12px; }
  .page-header .el-button { font-size: 12px; padding: 4px 8px; }
  .detail-layout { grid-template-columns: 1fr !important; gap: 12px; }
  .demand-card { padding: 14px; border-radius: 8px; }
  .demand-title { font-size: 16px; }
  .info-grid { grid-template-columns: 1fr; }
  .reward-grid { grid-template-columns: 1fr; }
  .action-card { position: sticky; bottom: 70px; z-index: 10; padding: 12px; }
  .action-btns-primary { flex-wrap: wrap; }
  .action-btns-primary .el-button { flex: 1; min-width: 60px; font-size: 12px; padding: 8px 10px; }
  .community-card { margin-top: 0; padding: 14px; }
  .comment-input textarea { font-size: 14px; }
}
</style>
