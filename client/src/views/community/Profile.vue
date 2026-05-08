<template>
  <div class="page">
    <h2>涓汉涓績</h2>

    <el-row :gutter="20" v-loading="loading" element-loading-text="鍔犺浇涓?..">
      <!-- 宸︿晶锛氱ぞ鍖哄熀鏈俊鎭?-->
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" :src="profile.logo" style="background:#26a269">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </el-avatar>
            <div class="community-name">{{ profile.community || profile.community_name || '绀惧尯' }}</div>
            <div class="district-name">{{ profile.district }} 路 {{ profile.street }}</div>
          </div>
          <div class="stats-row">
            <div class="stat-item"><div class="stat-val">{{ profile.demandCount || 0 }}</div><div class="stat-label">鍙戝竷闇€姹?/div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.intentionCount || 0 }}</div><div class="stat-label">鎾悎鎴愬姛</div></div>
            <div class="stat-item"><div class="stat-val">{{ profile.viewCount || 0 }}</div><div class="stat-label">娴忚閲?/div></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:12px" @click="startEdit">缂栬緫绀惧尯璧勬枡</el-button>
          <div class="quick-links">
            <div class="quick-link-item" @click="infoTab = 'favorites'">
              <el-icon><Star /></el-icon>
              <span>鎴戠殑鏀惰棌</span>
            </div>
            <div class="quick-link-item" @click="infoTab = 'rewards'">
              <span>馃巵</span>
              <span>鎴戠殑濂栧姳</span>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 鍙充晶锛氳缁嗕俊鎭?-->
      <el-col :xs="24" :sm="24" :md="16">
        <el-card v-if="!editing">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">绀惧尯璇︾粏璧勬枡</span>
              <el-button text type="primary" @click="startEdit"><el-icon><Edit /></el-icon> 缂栬緫</el-button>
            </div>
          </template>
          <el-tabs v-model="infoTab">
            <el-tab-pane label="鍩烘湰淇℃伅" name="basic">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="绀惧尯鍚嶇О">{{ profile.community || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="灏忓尯鍚嶇О">{{ profile.address || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鎵€灞炶鏀垮尯">{{ profile.district || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鎵€灞炶閬?>{{ profile.street || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鑱旂郴浜鸿亴鍔?>{{ profile.position || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鑱旂郴浜哄鍚?>{{ profile.real_name || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鑱旂郴鎵嬫満">{{ profile.phone || profile.username }}</el-descriptions-item>
                <el-descriptions-item label="璇︾粏鍦板潃" :span="2">{{ profile.address || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鍦板浘瀹氫綅" :span="2">
                  <template v-if="profile.latitude && profile.longitude">
                    <el-link :href="'https://maps.google.com/?q=' + profile.latitude + ',' + profile.longitude" target="_blank" type="primary">
                      馃搷 鏌ョ湅鍦板浘锛坽{ profile.latitude }}, {{ profile.longitude }}锛?
                    </el-link>
                  </template>
                  <span v-else>鏈缃畾浣?/span>
                </el-descriptions-item>
                <el-descriptions-item label="瀹℃牳鐘舵€?>
                  <el-tag :type="profile.status === 1 ? 'success' : 'warning'" size="small">
                    {{ profile.status === 1 ? '宸查€氳繃' : '寰呭鏍? }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="绀惧尯绠€浠? :span="2">{{ profile.description || '鏆傛棤绠€浠? }}</el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="淇敼瀵嗙爜" name="password">
              <div class="password-form">
                <el-alert type="info" :closable="false" style="margin-bottom: 16px">
                  涓轰繚闅滆处鍙峰畨鍏紝璇峰畾鏈熸洿鎹㈠瘑鐮併€傛柊瀵嗙爜闀垮害涓嶈兘灏戜簬6浣嶃€?
                </el-alert>
                <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px" style="max-width: 400px">
                  <el-form-item label="鏃у瘑鐮? prop="oldPassword">
                    <el-input v-model="passwordForm.oldPassword" type="password" placeholder="璇疯緭鍏ュ綋鍓嶅瘑鐮? show-password />
                  </el-form-item>
                  <el-form-item label="鏂板瘑鐮? prop="newPassword">
                    <el-input v-model="passwordForm.newPassword" type="password" placeholder="璇疯緭鍏ユ柊瀵嗙爜锛堣嚦灏?浣嶏級" show-password />
                  </el-form-item>
                  <el-form-item label="纭瀵嗙爜" prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="璇峰啀娆¤緭鍏ユ柊瀵嗙爜" show-password />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading">纭淇敼</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
            <el-tab-pane label="绀惧尯鐢诲儚" name="portrait">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="绀惧尯鍚嶇О">{{ profile.community || profile.community_name || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="璇︾粏鍦板潃">{{ profile.address || '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="绀惧尯鎬绘埛鏁?>{{ profile.total_households || profile.households || '鏈～鍐? }}鎴?/el-descriptions-item>
                <el-descriptions-item label="绀惧尯鍟嗘埛鏁?>{{ profile.merchant_count || 0 }}瀹?/el-descriptions-item>
                <el-descriptions-item label="浜插瓙瀹跺涵鍗犳瘮">{{ profile.family_ratio ? profile.family_ratio + '%' : '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鑰佸勾缇や綋鍗犳瘮">{{ profile.elderly_ratio ? profile.elderly_ratio + '%' : '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="鍏叡绌洪棿闈㈢Н">{{ profile.public_space_area ? profile.public_space_area + '銕? : '鏈～鍐? }}</el-descriptions-item>
                <el-descriptions-item label="閰嶅璁炬柦" :span="2">
                  <el-tag v-if="profile.has_outdoor_plaza" size="small" type="success" style="margin-right: 8px">馃彑锔?鎴峰骞垮満</el-tag>
                  <el-tag v-if="profile.has_commercial" size="small" type="success" style="margin-right: 8px">馃彧 鍟嗕笟閰嶅</el-tag>
                  <el-tag v-if="profile.has_school" size="small" type="success" style="margin-right: 8px">馃彨 瀛︽牎/骞煎効鍥?/el-tag>
                  <el-tag v-if="profile.has_park" size="small" type="success" style="margin-right: 8px">馃彏锔?鍏洯/浣撹偛璁炬柦</el-tag>
                  <span v-if="!profile.has_outdoor_plaza && !profile.has_commercial && !profile.has_school && !profile.has_park" style="color: #909399">鏆傛棤閰嶅璁炬柦</span>
                </el-descriptions-item>
                <el-descriptions-item label="鍦板浘瀹氫綅" :span="2">
                  <template v-if="profile.latitude && profile.longitude">
                    <el-link :href="'https://maps.google.com/?q=' + profile.latitude + ',' + profile.longitude" target="_blank" type="primary">
                      馃搷 鏌ョ湅鍦板浘锛坽{ profile.latitude }}, {{ profile.longitude }}锛?
                    </el-link>
                  </template>
                  <span v-else>鏈缃畾浣?/span>
                </el-descriptions-item>
                <el-descriptions-item label="绀惧尯绠€浠? :span="2">{{ profile.description || '鏆傛棤绠€浠? }}</el-descriptions-item>
              </el-descriptions>
              
              <!-- 绀惧尯鍥剧墖灞曠ず -->
              <div v-if="profile.images && profile.images.length > 0" style="margin-top: 16px">
                <div style="font-weight: 600; margin-bottom: 8px; color: #303133;">绀惧尯鍥剧墖</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <el-image 
                    v-for="(img, idx) in profile.images" 
                    :key="idx"
                    :src="img" 
                    style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                    :preview-src-list="profile.images"
                    fit="cover"
                  />
                </div>
              </div>
              
              <!-- 灏忓尯鍒楄〃灞曠ず -->
              <div v-if="profile.compounds && profile.compounds.length > 0" style="margin-top: 16px">
                <div style="font-weight: 600; margin-bottom: 8px; color: #303133;">馃彔 鎵€杈栧皬鍖?/div>
                <el-table :data="profile.compounds" size="small" border>
                  <el-table-column prop="name" label="灏忓尯鍚嶇О" />
                  <el-table-column prop="households" label="鎴锋暟" width="100" />
                </el-table>
              </div>
              
              <!-- 鍦哄湴绌洪棿灞曠ず -->
              <div v-if="profile.spaces && profile.spaces.length > 0" style="margin-top: 16px">
                <div style="font-weight: 600; margin-bottom: 8px; color: #303133;">馃彑锔?鍦哄湴绌洪棿</div>
                <div class="space-cards">
                  <el-card v-for="space in profile.spaces" :key="space.id" class="space-card" shadow="hover">
                    <template #header>
                      <div style="font-weight: 600">{{ space.name }}</div>
                    </template>
                    <div class="space-info">
                      <div class="space-row">
                        <span class="space-label">绫诲瀷锛?/span>
                        <el-tag size="small" :type="space.location_type === 0 ? 'primary' : 'success'">
                          {{ space.location_type === 0 ? '瀹ゅ唴' : '瀹ゅ' }}
                        </el-tag>
                        <span v-if="space.location_type === 0 && space.floor_number" style="margin-left: 8px">
                          {{ space.floor_number }}灞?
                        </span>
                      </div>
                      <div v-if="space.area" class="space-row">
                        <span class="space-label">闈㈢Н锛?/span>{{ space.area }}銕?
                      </div>
                      <div v-if="space.capacity" class="space-row">
                        <span class="space-label">瀹圭撼锛?/span>{{ space.capacity }}浜?
                      </div>
                      <div v-if="space.facilities && space.facilities.length > 0" class="space-row">
                        <span class="space-label">璁炬柦锛?/span>
                        <el-tag v-for="f in space.facilities" :key="f" size="small" style="margin: 2px">{{ f }}</el-tag>
                      </div>
                      <div class="space-row">
                        <span class="space-label">鍙敤锛?/span>
                        <template v-if="parseAvailableHours(space.available_hours).weekday">
                          <el-tag size="small" type="primary" style="margin-right: 8px">鍛ㄤ竴鑷冲懆浜?{{ parseAvailableHours(space.available_hours).weekday }}</el-tag>
                        </template>
                        <template v-if="parseAvailableHours(space.available_hours).weekend">
                          <el-tag size="small" type="success">鍛ㄥ叚鍛ㄦ棩 {{ parseAvailableHours(space.available_hours).weekend }}</el-tag>
                        </template>
                        <span v-if="!parseAvailableHours(space.available_hours).weekday && !parseAvailableHours(space.available_hours).weekend" style="color: #909399">鏈缃?/span>
                      </div>
                      <div v-if="space.description" class="space-row">
                        <span class="space-label">璇存槑锛?/span>{{ space.description }}
                      </div>
                      <div v-if="space.images && space.images.length > 0" class="space-images">
                        <el-image 
                          v-for="(img, idx) in space.images" 
                          :key="idx"
                          :src="img" 
                          style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 8px;"
                          :preview-src-list="space.images"
                          fit="cover"
                        />
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="鎴戠殑鏍囩" name="tags">
              <p style="color:#909399;font-size:13px;margin-bottom:12px">鏍囩瓒婄簿鍑嗭紝鏅鸿兘鍖归厤鏁堟灉瓒婂ソ</p>
              <div class="tag-list">
                <el-tag v-for="tag in (Array.isArray(profile.tags) ? profile.tags : (profile.tags ? profile.tags.split(',') : []))" :key="tag" style="margin:4px">{{ tag }}</el-tag>
              </div>
              <el-button type="primary" text style="margin-top:12px" @click="startEdit">绠＄悊鏍囩</el-button>
            </el-tab-pane>
            <el-tab-pane label="鎴戠殑鏀惰棌" name="favorites">
              <div class="favorites-list" v-loading="favLoading">
                <el-empty v-if="!favLoading && favorites.length === 0" description="鏆傛棤鏀惰棌璧勬簮" :image-size="80" />
                <el-card v-for="item in favorites" :key="item.id" shadow="hover" class="fav-card" @click="viewFavResource(item)">
                  <div class="fav-header">
                    <el-avatar :size="40" :src="item.merchant_logo" @error="() => true">
                      <el-icon :size="18"><Shop /></el-icon>
                    </el-avatar>
                    <div class="fav-info">
                      <div class="fav-title">{{ item.resource_title || item.title }}</div>
                      <div class="fav-meta">
                        <el-tag size="small" type="info">{{ getResourceTypeName(item.resource_type) }}</el-tag>
                        <span class="fav-merchant">{{ item.company_name }}</span>
                      </div>
                    </div>
                    <el-icon class="fav-star active"><Star /></el-icon>
                  </div>
                  <p class="fav-desc">{{ item.resource_content || item.content }}</p>
                </el-card>
              </div>
            </el-tab-pane>
            <el-tab-pane label="鎴戠殑濂栧姳" name="rewards">
              <div class="rewards-section" v-loading="rewardLoading">
                <!-- 濂栧姳缁熻 -->
                <div class="reward-stats">
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#67C23A">{{ rewardStats.totalCount }}</div>
                    <div class="reward-stat-label">绱濂栧姳</div>
                  </div>
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#409EFF">{{ rewardStats.pendingCount }}</div>
                    <div class="reward-stat-label">寰呴鍙?/div>
                  </div>
                  <div class="reward-stat-item">
                    <div class="reward-stat-value" style="color:#67C23A">{{ rewardStats.claimedCount }}</div>
                    <div class="reward-stat-label">宸查鍙?/div>
                  </div>
                </div>
                <!-- 濂栧姳璁板綍 -->
                <el-empty v-if="!rewardLoading && rewards.length === 0" description="鏆傛棤濂栧姳璁板綍" :image-size="80" />
                <div class="rewards-list">
                  <el-card v-for="item in rewards" :key="item.id" class="reward-card" shadow="hover">
                    <div class="reward-header">
                      <el-tag :type="rewardStatusType[item.status]" size="small">{{ rewardStatusName[item.status] }}</el-tag>
                      <span class="reward-time">{{ formatRewardTime(item.created_at || item.create_time) }}</span>
                    </div>
                    <div class="reward-body">
                      <span class="reward-icon">馃巵</span>
                      <div class="reward-info">
                        <div class="reward-title">鎾悎鎴愬姛濂栧姳</div>
                        <div class="reward-desc">{{ item.reward_content || '鎾悎鎴愬姛鐗╄祫濂栧姳' }}</div>
                        <div class="reward-meta" v-if="item.demand_title || item.resource_title">
                          <span v-if="item.demand_title">鍏宠仈闇€姹傦細{{ item.demand_title }}</span>
                          <span v-if="item.resource_title">鍏宠仈璧勬簮锛歿{ item.resource_title }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="reward-footer" v-if="item.status === 1">
                      <el-button type="success" size="small" @click="handleClaimReward(item)">纭棰嗗彇</el-button>
                    </div>
                  </el-card>
                </div>
                <!-- 鍒嗛〉 -->
                <div class="pagination" v-if="rewardTotal > rewardPageSize">
                  <el-pagination layout="prev,pager,next,total" :total="rewardTotal" :page-size="rewardPageSize" :current-page="rewardPage" @current-change="onRewardPageChange" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 缂栬緫琛ㄥ崟 -->
        <el-card v-else>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:700">缂栬緫绀惧尯璧勬枡</span>
              <el-button text @click="editing=false">鍙栨秷</el-button>
            </div>
          </template>
          <el-form :model="editForm" label-position="top" ref="formRef" class="edit-form-mobile">
            <el-divider content-position="left">鍩烘湰淇℃伅</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="鎵€灞炲尯">
                  <el-input v-model="editForm.district" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鎵€灞炶閬?>
                  <el-input v-model="editForm.street" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="绀惧尯鍚嶇О">
                  <el-input v-model="editForm.community" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鑱旂郴鎵嬫満">
                  <el-input v-model="editForm.phone" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鑱旂郴浜哄鍚?>
                  <el-input v-model="editForm.real_name" placeholder="璇疯緭鍏ヨ仈绯讳汉濮撳悕" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鑱旂郴浜鸿亴鍔?>
                  <el-input v-model="editForm.position" placeholder="濡傦細绀惧尯涓讳换" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="鍦板浘瀹氫綅">
                  <div class="map-location-input">
                    <el-input v-model="editForm.latitude" placeholder="绾害 濡傦細30.5728" style="width:160px;margin-right:8px" />
                    <el-input v-model="editForm.longitude" placeholder="缁忓害 濡傦細114.2553" style="width:160px;margin-right:8px" />
                    <el-link v-if="editForm.latitude && editForm.longitude" :href="'https://maps.google.com/?q=' + editForm.latitude + ',' + editForm.longitude" target="_blank" type="primary">馃搷 棰勮鍦板浘</el-link>
                    <span v-else style="color:#909399;font-size:12px">濉啓缁忕含搴﹀彲绮剧‘瀹氫綅绀惧尯浣嶇疆</span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="璇︾粏鍦板潃">
                  <el-input v-model="editForm.address" placeholder="璇︾粏鍦板潃锛堟ゼ鏍嬮棬鐗屽彿绛夛級" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="绀惧尯Logo">
                  <div class="upload-item">
                    <el-upload
                      class="logo-uploader"
                      :show-file-list="false"
                      :before-upload="beforeLogoUpload"
                      :http-request="uploadLogo"
                    >
                      <img v-if="editForm.logo" :src="editForm.logo" class="uploaded-logo" />
                      <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                    <span class="upload-tip">鐐瑰嚮涓婁紶Logo鍥剧墖锛堝缓璁?00x200锛?/span>
                  </div>
                </el-form-item>
              </el-col>

            </el-row>

            <el-divider content-position="left">绀惧尯鐢诲儚鏁版嵁</el-divider>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="绀惧尯鎬绘埛鏁?>
                  <el-input-number v-model="editForm.households" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <!-- 澶氬皬鍖虹紪杈?-->
              <el-col :span="24">
                <el-form-item label="鎵€杈栧皬鍖?>
                  <div class="compounds-editor">
                    <div v-for="(compound, index) in editForm.compounds" :key="index" class="compound-item">
                      <el-input v-model="compound.name" placeholder="灏忓尯鍚嶇О" style="width: 200px; margin-right: 8px" />
                      <el-input-number v-model="compound.households" :min="0" placeholder="鎴锋暟" style="width: 120px; margin-right: 8px" />
                      <el-button type="danger" :icon="Delete" circle @click="removeCompound(index)" />
                    </div>
                    <el-button type="primary" plain :icon="Plus" @click="addCompound">娣诲姞灏忓尯</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="绀惧尯鍟嗘埛鏁?>
                  <el-input-number v-model="editForm.merchant_count" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="浜插瓙瀹跺涵鍗犳瘮">
                  <el-input v-model="editForm.family_ratio" placeholder="濡傦細35" />%
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鑰佸勾缇や綋鍗犳瘮">
                  <el-input v-model="editForm.elderly_ratio" placeholder="濡傦細28" />%
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鍏叡绌洪棿闈㈢Н(銕?">
                  <el-input-number v-model="editForm.public_space_area" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鎴峰骞垮満">
                  <el-switch v-model="editForm.has_outdoor_plaza" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鍟嗕笟浣?鍟嗕笟琛?>
                  <el-switch v-model="editForm.has_commercial" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="瀛︽牎/骞煎効鍥?>
                  <el-switch v-model="editForm.has_school" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="鍏洯/浣撹偛鍦洪">
                  <el-switch v-model="editForm.has_park" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="绀惧尯绠€浠?>
                  <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="绠€瑕佷粙缁嶇ぞ鍖虹壒鑹?.." />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">绀惧尯鏍囩</el-divider>
            <el-form-item label="閫夋嫨鏍囩">
              <div class="tag-selector">
                <el-check-tag
                  v-for="tag in allTags" :key="tag"
                  :checked="editForm.tagsList.includes(tag)"
                  @change="toggleTag(tag)" style="margin:4px"
                >{{ tag }}</el-check-tag>
              </div>
            </el-form-item>

            <!-- 鍦哄湴绌洪棿褰曞叆 -->
            <el-divider content-position="left">鍦哄湴绌洪棿褰曞叆</el-divider>
            <div class="spaces-editor">
              <div v-for="(space, sIdx) in editForm.spaces" :key="sIdx" class="space-edit-card">
                <div class="space-edit-header">
                  <span style="font-weight: 600">鍦哄湴 {{ sIdx + 1 }}</span>
                  <el-button type="danger" :icon="Delete" circle @click="removeSpace(sIdx)" />
                </div>
                <el-row :gutter="16">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="鍦哄湴鍚嶇О" class="compact-form-item">
                      <el-input v-model="space.name" placeholder="濡傦細绀惧尯娲诲姩涓績" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="绫诲瀷" class="compact-form-item">
                      <el-radio-group v-model="space.location_type" size="small">
                        <el-radio-button :value="0">瀹ゅ唴</el-radio-button>
                        <el-radio-button :value="1">瀹ゅ</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="闈㈢Н" class="compact-form-item">
                      <el-input-number v-model="space.area" :min="0" placeholder="銕? style="width:100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <el-form-item label="瀹圭撼浜烘暟" class="compact-form-item">
                      <el-input-number v-model="space.capacity" :min="0" placeholder="浜? style="width:100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="8" v-if="space.location_type === 0">
                    <el-form-item label="妤煎眰" class="compact-form-item">
                      <el-input-number v-model="space.floor_number" :min="1" :max="100" placeholder="绗嚑灞? style="width:100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="鍦哄湴鐓х墖" class="compact-form-item">
                  <div class="space-images-editor">
                    <div class="space-images-preview">
                      <div v-for="(img, imgIdx) in space.images" :key="'exist-' + imgIdx" class="space-image-item">
                        <el-image :src="img" fit="cover" style="width: 80px; height: 80px; border-radius: 4px;" />
                        <el-icon class="remove-icon" @click="removeSpaceImage(sIdx, imgIdx)"><Close /></el-icon>
                      </div>
                      <div v-for="(file, fileIdx) in (space.newImages || [])" :key="'new-' + fileIdx" class="space-image-item">
                        <el-image :src="file.url" fit="cover" style="width: 80px; height: 80px; border-radius: 4px;" />
                        <el-icon class="remove-icon" @click="removeSpaceNewImage(sIdx, fileIdx)"><Close /></el-icon>
                      </div>
                    </div>
                    <el-upload
                      :show-file-list="false"
                      accept="image/*"
                      :before-upload="(file) => beforeSpaceImageUpload(file, sIdx)"
                      multiple
                    >
                      <el-button size="small" plain :icon="Plus">涓婁紶鐓х墖</el-button>
                    </el-upload>
                    <div class="upload-tip">寤鸿涓婁紶姝ｉ潰銆佷晶闈€佸唴閮ㄥ叏鏅瓑澶氳搴︾収鐗?/div>
                  </div>
                </el-form-item>
                <el-form-item label="璁炬柦璁惧" class="compact-form-item">
                  <div class="facility-selector">
                    <el-check-tag
                      v-for="facility in FACILITY_OPTIONS" :key="facility"
                      :checked="(space.facilities || []).includes(facility)"
                      @change="toggleSpaceFacility(sIdx, facility)"
                      style="margin:4px"
                    >{{ facility }}</el-check-tag>
                    <el-input
                      v-model="space.customFacilities"
                      placeholder="鍏朵粬璁炬柦锛堥€楀彿鍒嗛殧锛?
                      style="width: 200px; margin-left: 8px"
                      size="small"
                    />
                  </div>
                </el-form-item>
                <el-form-item label="鍙敤鏃堕棿" class="compact-form-item">
                  <div class="available-time-editor">
                    <!-- 鍛ㄤ竴鑷冲懆浜旀椂闂存 -->
                    <div class="time-section">
                      <span class="time-label">鍛ㄤ竴鑷冲懆浜旓細</span>
                      <el-time-select
                        v-model="space.weekday_start"
                        placeholder="寮€濮嬫椂闂?
                        start="06:00"
                        step="00:30"
                        end="23:00"
                        style="width: 120px; margin-right: 8px"
                      />
                      <span class="time-separator">鑷?/span>
                      <el-time-select
                        v-model="space.weekday_end"
                        placeholder="缁撴潫鏃堕棿"
                        start="06:00"
                        step="00:30"
                        end="23:30"
                        style="width: 120px; margin-left: 8px"
                      />
                    </div>
                    <!-- 鍛ㄥ叚鍛ㄦ棩鏃堕棿娈?-->
                    <div class="time-section">
                      <span class="time-label">鍛ㄥ叚鍛ㄦ棩锛?/span>
                      <el-time-select
                        v-model="space.weekend_start"
                        placeholder="寮€濮嬫椂闂?
                        start="06:00"
                        step="00:30"
                        end="23:00"
                        style="width: 120px; margin-right: 8px"
                      />
                      <span class="time-separator">鑷?/span>
                      <el-time-select
                        v-model="space.weekend_end"
                        placeholder="缁撴潫鏃堕棿"
                        start="06:00"
                        step="00:30"
                        end="23:30"
                        style="width: 120px; margin-left: 8px"
                      />
                    </div>
                  </div>
                </el-form-item>
              </div>
              <el-button type="primary" plain :icon="Plus" @click="addSpace" style="margin-top: 8px">娣诲姞鍦哄湴</el-button>
            </div>

            <div style="text-align:right;margin-top:16px">
              <el-button @click="editing=false">鍙栨秷</el-button>
              <el-button type="primary" @click="saveProfile" :loading="saving">淇濆瓨璧勬枡</el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Edit, Shop, Star, Plus, Delete, Close } from '@element-plus/icons-vue'
import { getProfile, updateProfile, updatePassword, getMyFavorites, getRewards, claimReward, saveCompounds, saveSpaces } from '@/api/community'
import { uploadImage } from '@/api/public'

// 鍦哄湴璁炬柦棰勮閫夐」
const FACILITY_OPTIONS = [
  '鎶曞奖', '鐢靛瓙灞?, '闊冲搷', '璇濈瓛', '妗屾', '鐧芥澘',
  'wifi', '绌鸿皟', '绐楀笜', '鐏厜', '鑸炲彴', '璁插彴',
  '楗按鏈?, '鍋滆溅鍦?, '鏃犻殰纰嶈鏂?, '娲楁墜闂?
]

// ========== 灏忓尯缂栬緫鐩稿叧鍑芥暟 ==========
function addCompound() {
  editForm.value.compounds.push({ id: null, name: '', households: null })
}

function removeCompound(index) {
  editForm.value.compounds.splice(index, 1)
}

// ========== 鍦哄湴绌洪棿缂栬緫鐩稿叧鍑芥暟 ==========
function addSpace() {
  editForm.value.spaces.push({
    id: null,
    name: '',
    location_type: 0,
    floor_number: null,
    area: null,
    capacity: null,
    facilities: [],
    customFacilities: '',
    // 鍙敤鏃堕棿锛堢粨鏋勫寲锛?
    weekday_start: '',
    weekday_end: '',
    weekend_start: '',
    weekend_end: '',
    // 鍏煎鏃х殑鏂囨湰鏍煎紡
    available_hours: '',
    images: [],
    newImages: []
  })
}

function removeSpace(index) {
  editForm.value.spaces.splice(index, 1)
}

function toggleSpaceFacility(spaceIdx, facility) {
  const facilities = editForm.value.spaces[spaceIdx].facilities
  const idx = facilities.indexOf(facility)
  if (idx >= 0) {
    facilities.splice(idx, 1)
  } else {
    facilities.push(facility)
  }
}

function beforeSpaceImageUpload(file, spaceIdx) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('鍙兘涓婁紶鍥剧墖鏂囦欢')
  if (!isLt2M) ElMessage.error('鍥剧墖澶у皬涓嶈兘瓒呰繃2MB')
  if (isImage && isLt2M) {
    // 鍒涘缓棰勮URL
    const url = URL.createObjectURL(file)
    if (!editForm.value.spaces[spaceIdx].newImages) {
      editForm.value.spaces[spaceIdx].newImages = []
    }
    editForm.value.spaces[spaceIdx].newImages.push({ raw: file, url })
  }
  return false // 闃绘榛樿涓婁紶
}

function removeSpaceImage(spaceIdx, imgIdx) {
  editForm.value.spaces[spaceIdx].images.splice(imgIdx, 1)
}

// 瑙ｆ瀽鍙敤鏃堕棿锛堟敮鎸丣SON鏍煎紡鍜屾棫鏂囨湰鏍煎紡锛?
function parseAvailableHours(availableHours) {
  if (!availableHours) return { weekday: '', weekend: '' }
  // 鏂版牸寮?JSON: {"weekday":"09:00-18:00","weekend":"10:00-16:00"}
  try {
    if (typeof availableHours === 'string' && availableHours.startsWith('{')) {
      const obj = JSON.parse(availableHours)
      return {
        weekday: obj.weekday || '',
        weekend: obj.weekend || ''
      }
    }
  } catch {}
  // 鏃ф牸寮忔枃鏈洿鎺ヨ繑鍥?
  return { weekday: availableHours, weekend: '' }
}

function removeSpaceNewImage(spaceIdx, fileIdx) {
  // 閲婃斁blob URL
  const file = editForm.value.spaces[spaceIdx].newImages[fileIdx]
  if (file.url) URL.revokeObjectURL(file.url)
  editForm.value.spaces[spaceIdx].newImages.splice(fileIdx, 1)
}

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const infoTab = ref('basic')
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordRules = {
  oldPassword: [{ required: true, message: '璇疯緭鍏ユ棫瀵嗙爜', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '璇疯緭鍏ユ柊瀵嗙爜', trigger: 'blur' },
    { min: 6, message: '鏂板瘑鐮侀暱搴︿笉鑳藉皯浜?浣?, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '璇峰啀娆¤緭鍏ユ柊瀵嗙爜', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('涓ゆ杈撳叆鐨勫瘑鐮佷笉涓€鑷?))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
const profile = ref({})
const favorites = ref([])
const favLoading = ref(false)

// 濂栧姳鐩稿叧
const rewardLoading = ref(false)
const rewards = ref([])
const rewardTotal = ref(0)
const rewardPage = ref(1)
const rewardPageSize = 10
const rewardStatusName = { 0: '寰呭彂鏀?, 1: '寰呴鍙?, 2: '宸查鍙?, 3: '宸插け鏁? }
const rewardStatusType = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }

// 璧勬簮绫诲瀷鏄犲皠锛堜粠API鍔ㄦ€佸姞杞斤級
const resourceTypeNumMap = ref({})
const getResourceTypeName = (type) => {
  if (typeof type === 'string' && resourceTypeNumMap.value[type] !== undefined) {
    return resourceTypeNumMap.value[type]
  }
  const num = parseInt(type)
  if (!isNaN(num) && resourceTypeNumMap.value[num] !== undefined) {
    return resourceTypeNumMap.value[num]
  }
  if (typeof type === 'string') {
    return type
  }
  return type || '鍏朵粬'
}

// 鍔犺浇璧勬簮绫诲瀷閰嶇疆
async function loadResourceTypes() {
  try {
    const { getPublishTypes } = await import('@/api/community')
    const res = await getPublishTypes()
    if (res.data?.resource_types?.length) {
      const map = {}
      res.data.resource_types.forEach((item, idx) => {
        const name = (typeof item === 'object' && item !== null) ? item.name : item
        const id = (typeof item === 'object' && item !== null) ? item.id : idx
        map[id] = name
        map[name] = name
      })
      resourceTypeNumMap.value = map
    }
  } catch {}
}

const rewardStats = computed(() => ({
  totalCount: rewards.value.length,
  pendingCount: rewards.value.filter(r => r.status === 1).length,
  claimedCount: rewards.value.filter(r => r.status === 2).length
}))

const allTags = [
  '浜插瓙鍙嬪ソ', '鑰佸勾鏈嶅姟', '鏂囧寲娲诲姩', '浣撹偛璧涗簨', '鏁欒偛璧勬簮', '鍋ュ悍绀惧尯',
  '鍏泭娲诲姩', '绉戞妧鍒涙柊', '鐜繚缁胯壊', '鍟嗕笟娲昏穬', '灞呮皯鍙備笌搴﹂珮', '鑺傚簡姘涘洿娴?,
  '渚挎皯鏈嶅姟', '鏂囪壓婕斿嚭', '浜插瓙娲诲姩', '鍋ュ悍璁插骇', '娉曞緥鍜ㄨ', '蹇楁効鏈嶅姟',
  '鑺傛棩搴嗗吀', '鎶€鑳藉煿璁?, '閭婚噷浜掑姪', '鍨冨溇鍒嗙被', '娑堥槻瀹夊叏', '闃茶瘓楠楀浼?,
  '鍎跨鎵樼', '瀹剁數缁翠慨', '灞呭鍏昏€?, '绀惧尯鍥㈣喘', '蹇冪悊鍋ュ悍', '杩愬姩鍋ヨ韩'
]

const editForm = ref({
  real_name: '',
  community: '',
  district: '',
  street: '',
  position: '',
  phone: '',
  address: '',
  latitude: '',
  longitude: '',
  logo: '',
  imagesStr: '',
  logoImagesList: [],
  households: null,
  merchant_count: null,
  family_ratio: '',
  elderly_ratio: '',
  public_space_area: null,
  has_outdoor_plaza: 0,
  has_commercial: 0,
  has_school: 0,
  has_park: 0,
  description: '',
  tagsList: [],
  // 澶氬皬鍖烘暟鎹?
  compounds: [],
  // 鍦哄湴绌洪棿鏁版嵁
  spaces: []
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await getProfile()
    profile.value = res.data || {}
  } catch {
    ElMessage.error('鍔犺浇绀惧尯璧勬枡澶辫触')
  } finally {
    loading.value = false
  }
}

function startEdit() {
  const tags = profile.value.tags
  const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',') : [])
  const images = profile.value.images
  const imagesArray = Array.isArray(images) ? images : (images ? images.split(',').filter(Boolean) : [])
  // 澶勭悊灏忓尯鏁版嵁
  const compounds = profile.value.compounds && profile.value.compounds.length > 0
    ? profile.value.compounds.map(c => ({ ...c }))
    : []
  // 澶勭悊鍦哄湴绌洪棿鏁版嵁
  const spaces = profile.value.spaces && profile.value.spaces.length > 0
    ? profile.value.spaces.map(s => {
        // 瑙ｆ瀽鍙敤鏃堕棿娈碉紙鏀寔鏂版棫涓ょ鏍煎紡锛?
        let weekday_start = '', weekday_end = '', weekend_start = '', weekend_end = ''
        if (s.available_hours) {
          // 鏂版牸寮?JSON: {"weekday":"09:00-18:00","weekend":"10:00-16:00"}
          try {
            const hoursObj = typeof s.available_hours === 'string' ? JSON.parse(s.available_hours) : s.available_hours
            if (hoursObj.weekday) {
              const [wStart, wEnd] = hoursObj.weekday.split('-')
              weekday_start = wStart || ''
              weekday_end = wEnd || ''
            }
            if (hoursObj.weekend) {
              const [weStart, weEnd] = hoursObj.weekend.split('-')
              weekend_start = weStart || ''
              weekend_end = weEnd || ''
            }
          } catch {
            // 鏃ф牸寮忔枃鏈細灏濊瘯瑙ｆ瀽 "鍛ㄤ竴鑷冲懆浜?9:00-18:00"
            const weekdayMatch = s.available_hours.match(/鍛╗涓€涓夊洓浜擼?[^鍛╙*?(\d{1,2}:\d{2})[^鍛ㄥ叚]*?(\d{1,2}:\d{2})/)
            const weekendMatch = s.available_hours.match(/鍛ㄥ叚?鏃^鑷砞*?鑷砙^:]*?(\d{1,2}:\d{2})[^:]*?(\d{1,2}:\d{2})/)
            if (weekdayMatch) {
              weekday_start = weekdayMatch[1]
              weekday_end = weekdayMatch[2]
            }
            if (weekendMatch) {
              weekend_start = weekendMatch[1]
              weekend_end = weekendMatch[2]
            }
          }
        }
        return {
          ...s,
          // 濡傛灉 images 鏄瓧绗︿覆锛岃浆鎹负鏁扮粍
          images: Array.isArray(s.images) ? s.images : (s.images ? s.images.split(',').filter(Boolean) : []),
          // 澶勭悊璁炬柦閫夐」锛岀‘淇濇槸鏁扮粍
          facilities: Array.isArray(s.facilities) ? s.facilities : [],
          // 澶勭悊鑷畾涔夎鏂?
          customFacilities: s.custom_facilities || '',
          // 澶勭悊鍙敤鏃舵锛堢粨鏋勫寲锛?
          weekday_start,
          weekday_end,
          weekend_start,
          weekend_end,
          // 鍏煎鏃х殑鏂囨湰鏍煎紡
          available_hours: s.available_hours || '',
          // 涓存椂瀛樺偍鏂颁笂浼犵殑鍥剧墖
          newImages: []
        }
      })
    : []
  editForm.value = {
    real_name: profile.value.real_name || '',
    community: profile.value.community || '',
    district: profile.value.district || '',
    street: profile.value.street || '',
    district: profile.value.district || '',
    street: profile.value.street || '',
    position: profile.value.position || '',
    phone: profile.value.phone || '',
    address: profile.value.address || '',
    latitude: profile.value.latitude || '',
    longitude: profile.value.longitude || '',
    logo: profile.value.logo || '',
    imagesStr: imagesArray.join(','),
    logoImagesList: [],
    households: profile.value.households || null,
    merchant_count: profile.value.merchant_count || null,
    family_ratio: profile.value.family_ratio || '',
    elderly_ratio: profile.value.elderly_ratio || '',
    public_space_area: profile.value.public_space_area || null,
    has_outdoor_plaza: profile.value.has_outdoor_plaza || 0,
    has_commercial: profile.value.has_commercial || 0,
    has_school: profile.value.has_school || 0,
    has_park: profile.value.has_park || 0,
    description: profile.value.description || '',
    tagsList: tagsArray,
    compounds,
    spaces
  }
  editing.value = true
  infoTab.value = 'basic'
}

function toggleTag(tag) {
  const idx = editForm.value.tagsList.indexOf(tag)
  if (idx >= 0) editForm.value.tagsList.splice(idx, 1)
  else editForm.value.tagsList.push(tag)
}

async function saveProfile() {
  saving.value = true
  try {
    // 澶勭悊鍦哄湴鍥剧墖涓婁紶
    const images = editForm.value.imagesStr
      ? editForm.value.imagesStr.split(',').map(s => s.trim()).filter(Boolean)
      : []
    // 濡傛灉鏈夋柊涓婁紶鐨勫浘鐗囷紝鍏堜笂浼?
    const newImages = editForm.value.logoImagesList || []
    for (const file of newImages) {
      if (file.raw) {
        try {
          const res = await uploadImage(file.raw)
          images.push(res.data.url)
        } catch (err) {
          console.error('Logo涓婁紶澶辫触:', err)
          ElMessage.error('Logo鍥剧墖涓婁紶澶辫触')
        }
      }
    }
    await updateProfile({
      logo: editForm.value.logo,
      address: editForm.value.address,
      position: editForm.value.position,
      images,
      households: editForm.value.households,
      merchant_count: editForm.value.merchant_count,
      family_ratio: editForm.value.family_ratio,
      elderly_ratio: editForm.value.elderly_ratio,
      public_space_area: editForm.value.public_space_area,
      has_outdoor_plaza: editForm.value.has_outdoor_plaza,
      has_commercial: editForm.value.has_commercial,
      has_school: editForm.value.has_school,
      has_park: editForm.value.has_park,
      description: editForm.value.description,
      tags: editForm.value.tagsList,
      real_name: editForm.value.real_name,
      community: editForm.value.community,
      latitude: editForm.value.latitude ? parseFloat(editForm.value.latitude) : null,
      longitude: editForm.value.longitude ? parseFloat(editForm.value.longitude) : null
    })
    
    // 淇濆瓨灏忓尯鏁版嵁
    const compounds = editForm.value.compounds.map(c => ({
      id: c.id || null,
      name: c.name,
      households: c.households
    }))
    await saveCompounds({ compounds })
    
    // 淇濆瓨鍦哄湴绌洪棿鏁版嵁
    const spacesData = []
    for (const space of editForm.value.spaces) {
      // 澶勭悊鍦哄湴鍥剧墖涓婁紶
      const spaceImages = [...(space.images || [])]
      if (space.newImages && space.newImages.length > 0) {
        for (const file of space.newImages) {
          if (file.raw) {
            try {
              const res = await uploadImage(file.raw)
              if (res.data && res.data.url) {
                spaceImages.push(res.data.url)
              } else {
                throw new Error('涓婁紶鍝嶅簲鏍煎紡閿欒')
              }
            } catch (err) {
              console.error('鍦哄湴鍥剧墖涓婁紶澶辫触:', err)
              ElMessage.error('鍦哄湴鍥剧墖涓婁紶澶辫触锛岃閲嶈瘯')
            }
          }
        }
      }
      // 澶勭悊鍙敤鏃堕棿锛堢粨鏋勫寲鏁版嵁杞负JSON锛?
      let available_hours = ''
      if (space.weekday_start || space.weekday_end || space.weekend_start || space.weekend_end) {
        available_hours = JSON.stringify({
          weekday: (space.weekday_start && space.weekday_end) ? `${space.weekday_start}-${space.weekday_end}` : '',
          weekend: (space.weekend_start && space.weekend_end) ? `${space.weekend_start}-${space.weekend_end}` : ''
        })
      }
      spacesData.push({
        id: space.id || null,
        name: space.name,
        location_type: space.location_type,
        floor_number: space.location_type === 0 ? space.floor_number : null,
        area: space.area,
        capacity: space.capacity,
        facilities: space.facilities || [],
        custom_facilities: space.customFacilities || '',
        available_hours,
        images: spaceImages
      })
    }
    await saveSpaces({ spaces: spacesData })
    
    await loadProfile()
    editing.value = false
    ElMessage.success('绀惧尯璧勬枡宸蹭繚瀛?)
  } catch {
    ElMessage.error('淇濆瓨澶辫触')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
  loadResourceTypes()
  // 浠?URL 鍙傛暟鍒囨崲 Tab锛堟潵鑷鑸笅鎷夌殑銆屾垜鐨勬敹钘忋€嶃€屾垜鐨勫鍔便€嶏級
  const tab = new URLSearchParams(window.location.search).get('tab')
  if (tab === 'favorites' || tab === 'rewards') {
    infoTab.value = tab
  }
})

// 鍔犺浇鏀惰棌鍒楄〃
async function loadFavorites() {
  favLoading.value = true
  try {
    const res = await getMyFavorites()
    favorites.value = res.data?.list || res.data || []
  } catch {
    favorites.value = []
  } finally {
    favLoading.value = false
  }
}

// 鏌ョ湅鏀惰棌鐨勮祫婧愯鎯?
function viewFavResource(item) {
  const id = item.resource_id || item.id
  router.push(`/community/resources/${id}`)
}

// Logo涓婁紶鍓嶆鏌?
function beforeLogoUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('鍙兘涓婁紶鍥剧墖鏂囦欢')
  if (!isLt2M) ElMessage.error('鍥剧墖澶у皬涓嶈兘瓒呰繃2MB')
  return isImage && isLt2M
}

// 涓婁紶Logo
async function uploadLogo(options) {
  try {
    const res = await uploadImage(options.file)
    editForm.value.logo = res.data.url
    ElMessage.success('Logo涓婁紶鎴愬姛')
  } catch {
    ElMessage.error('Logo涓婁紶澶辫触')
  }
}

// 鐩戝惉鍒囨崲鍒版敹钘弔ab鏃跺姞杞?
watch(infoTab, (newTab) => {
  if (newTab === 'favorites') {
    loadFavorites()
  } else if (newTab === 'rewards') {
    loadRewards()
  }
})

// 淇敼瀵嗙爜
async function handleChangePassword() {
  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }
  passwordLoading.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('瀵嗙爜淇敼鎴愬姛')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (err) {
    ElMessage.error(err.message || '淇敼澶辫触')
  } finally {
    passwordLoading.value = false
  }
}

// 濂栧姳鐩稿叧鍑芥暟
async function loadRewards() {
  rewardLoading.value = true
  try {
    const res = await getRewards({ page: rewardPage.value, pageSize: rewardPageSize })
    rewards.value = res.data?.list || res.data || []
    rewardTotal.value = res.data?.pagination?.total || rewards.value.length
  } catch {
    rewards.value = []
  } finally {
    rewardLoading.value = false
  }
}

function formatRewardTime(time) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleClaimReward(item) {
  try {
    await claimReward({ id: item.id })
    ElMessage.success('宸茬‘璁ら鍙栧鍔?)
    loadRewards()
  } catch {
    ElMessage.error('棰嗗彇澶辫触锛岃閲嶈瘯')
  }
}

function onRewardPageChange(page) {
  rewardPage.value = page
  loadRewards()
}
</script>

<style scoped>
/* ===== 鍩虹鏍峰紡锛堝叡浜級===== */
.community-name { font-size: 17px; font-weight: 700; margin-top: 10px; }
.district-name { font-size: 13px; color: #909399; margin-top: 4px; }
.stats-row { display: flex; justify-content: space-around; margin: 16px 0; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.quick-links { display: flex; gap: 8px; margin-top: 10px; justify-content: center; }
.quick-link-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; background: #f5f7fa; color: #606266; font-size: 13px; cursor: pointer; transition: all 0.2s; flex: 1; justify-content: center; }
.quick-link-item:hover { background: #ecf5ff; color: #409EFF; }
.stat-item { text-align: center; }
.stat-val { font-size: 22px; font-weight: 700; color: #1a56db; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.tag-list { display: flex; flex-wrap: wrap; }
.tag-selector { display: flex; flex-wrap: wrap; }
.favorites-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.fav-card { cursor: pointer; transition: transform 0.2s; }
.fav-card:hover { transform: translateY(-2px); }
.fav-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.fav-info { flex: 1; min-width: 0; }
.fav-title { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.fav-merchant { font-size: 12px; color: #409EFF; }
.fav-star { font-size: 18px; color: #f56c6c; }
.fav-star.active { color: #f56c6c; }
.fav-desc { font-size: 13px; color: #606266; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.reward-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.reward-stat-item { background: #f5f7fa; border-radius: 8px; padding: 12px; text-align: center; }
.reward-stat-value { font-size: 24px; font-weight: 700; }
.reward-stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.rewards-list { display: flex; flex-direction: column; gap: 12px; }
.reward-card { border-radius: 8px; }
.reward-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.reward-time { font-size: 12px; color: #909399; }
.reward-body { display: flex; gap: 12px; }
.reward-icon { font-size: 28px; line-height: 1; }
.reward-info { flex: 1; }
.reward-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.reward-desc { font-size: 13px; color: #606266; margin-bottom: 6px; }
.reward-meta { font-size: 12px; color: #909399; display: flex; gap: 12px; flex-wrap: wrap; }
.reward-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; text-align: right; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.upload-item { display: flex; align-items: center; gap: 12px; }
.logo-uploader { border: 1px dashed #d9d9d9; border-radius: 8px; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s; }
.logo-uploader:hover { border-color: #409EFF; }
.logo-uploader-icon { font-size: 24px; color: #8c8c8c; }
.uploaded-logo { width: 78px; height: 78px; object-fit: cover; border-radius: 6px; }
.upload-tip { font-size: 12px; color: #909399; }
.map-location-input { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.password-form { padding: 10px 0; }
.space-cards { display: flex; flex-wrap: wrap; gap: 12px; }
.space-card { width: 300px; }
.space-info { font-size: 13px; color: #606266; }
.space-row { margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.space-label { color: #909399; min-width: 50px; }
.space-images { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
.compound-item { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 8px; background: #f5f7fa; border-radius: 4px; }
.compound-item .el-input { flex: 1; }
.compound-item .el-input-number { flex: 0 0 120px; }
.space-edit-item { padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px; }
.space-edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.space-edit-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.space-edit-row .el-form-item { margin-bottom: 0; flex: 1; min-width: 200px; }
.facility-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.custom-facility { display: flex; gap: 8px; margin-top: 8px; }
.available-hours { display: flex; gap: 8px; flex-wrap: wrap; }
.available-hours .el-select { width: 200px; }
.space-images-upload { display: flex; flex-wrap: wrap; gap: 8px; }
.compounds-editor { display: flex; flex-direction: column; gap: 8px; }
.spaces-editor { display: flex; flex-direction: column; gap: 12px; }
.space-edit-card { background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.space-edit-card .space-edit-header { border-bottom: 1px solid #e4e7ed; padding-bottom: 8px; margin-bottom: 16px; }
.space-images-editor { display: flex; flex-direction: column; gap: 8px; }
.space-images-preview { display: flex; flex-wrap: wrap; gap: 8px; }
.space-images-preview .space-image-item { position: relative; width: 80px; height: 80px; }
.space-images-preview .space-image-item .el-image { width: 80px; height: 80px; border-radius: 4px; }
.space-images-preview .space-image-item .remove-icon { position: absolute; top: -6px; right: -6px; background: #fff; border-radius: 50%; cursor: pointer; color: #f56c6c; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.facility-selector { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.compact-form-item { margin-bottom: 12px; }
.compact-form-item :deep(.el-form-item__label) { font-size: 13px; }

/* ===== PC 绔牱寮忥紙>=769px锛?==== */
@media (min-width: 769px) {
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px 20px 40px;
    min-height: 100vh;
    background: #f0f2f5;
  }
  .page h2 {
    margin-bottom: 20px;
    font-size: 22px;
    font-weight: 700;
    padding: 16px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .profile-card {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  .avatar-area { margin-bottom: 24px; }
}

/* ===== 绉诲姩绔牱寮忥紙<=768px锛?==== */
@media (max-width: 768px) {
  .page { padding-bottom: 70px; }
  .page h2 { font-size: 18px; margin-bottom: 14px; padding: 12px 14px; background: white; border-radius: 0; border-bottom: 1px solid #eee; }
  .profile-card { padding: 16px; border-radius: 8px; }
  .avatar-area { margin-bottom: 16px; }
  .avatar-area .el-avatar { width: 64px !important; height: 64px !important; }
  .community-name { font-size: 15px; }
  .space-card { width: 100%; }
  :deep(.el-descriptions) { font-size: 13px; }
  .edit-form-mobile { padding: 0 14px; }
  .edit-form-mobile :deep(.el-form-item) { margin-bottom: 14px; }
  .edit-form-mobile :deep(.el-form-item__label) { font-size: 13px; color: #606266; padding-bottom: 4px; }
  .edit-form-mobile :deep(.el-form-item__content) { font-size: 14px; }
  .edit-form-mobile :deep(.el-divider) { margin: 12px 0; }
  .edit-form-mobile :deep(.el-row) { margin-left: 0 !important; margin-right: 0 !important; }
  .edit-form-mobile :deep(.el-col) { padding-left: 0 !important; padding-right: 0 !important; }
  .edit-form-mobile :deep(.el-input),
  .edit-form-mobile :deep(.el-input-number),
  .edit-form-mobile :deep(.el-select) { width: 100% !important; }
  /* 地图定位 - 强制覆盖 inline style */
  .edit-form-mobile :deep(.map-location-input .el-input) { width: 100% !important; margin-right: 0 !important; }
  .map-location-input { display: flex; flex-direction: column; gap: 8px; }
  /* 小区编辑 - 强制覆盖 inline style */
  .edit-form-mobile :deep(.compound-item .el-input) { width: 100% !important; margin-right: 0 !important; }
  .edit-form-mobile :deep(.compound-item .el-input-number) { width: 100% !important; margin-right: 0 !important; }
  .compound-item { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
  .edit-form-mobile :deep(.compounds-editor .el-button) { width: 100%; margin-top: 8px; }
  .upload-item { display: flex; flex-direction: column; gap: 8px; }
  .upload-tip { font-size: 11px; color: #909399; }
  :deep(.el-descriptions__label) { width: 100px; font-size: 12px; }
  /* ===== 场地空间编辑器 - 移动端 ===== */
  .edit-form-mobile :deep(.space-edit-card) { margin-bottom: 16px; border: 1px solid #e4e7ed; border-radius: 8px; padding: 12px; }
  .edit-form-mobile :deep(.space-edit-header) { flex-direction: column; gap: 8px; align-items: flex-start; margin-bottom: 12px; }
  /* 强制 el-row/el-col 单列铺满 */
  .edit-form-mobile :deep(.space-edit-card .el-row) { margin-left: 0 !important; margin-right: 0 !important; display: flex; flex-direction: column; }
  .edit-form-mobile :deep(.space-edit-card .el-col) { max-width: 100% !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
  .edit-form-mobile :deep(.space-edit-card .el-form-item) { margin-bottom: 10px; }
  /* 设施选择器 - 强制覆盖 inline style width:200px */
  .edit-form-mobile :deep(.facility-selector) { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .edit-form-mobile :deep(.facility-selector .el-check-tag) { font-size: 12px; padding: 3px 8px; margin: 2px !important; }
  .edit-form-mobile :deep(.facility-selector .el-input) { width: 100% !important; margin-left: 0 !important; margin-top: 6px; }
  /* 可用时间 - 强制覆盖 inline style width:120px */
  .edit-form-mobile :deep(.available-time-editor) { display: flex; flex-direction: column; gap: 12px; }
  .edit-form-mobile :deep(.available-time-editor .time-section) { display: flex; flex-direction: column; gap: 6px; }
  .edit-form-mobile :deep(.available-time-editor .time-label) { font-size: 12px; color: #909399; text-align: left; }
  .edit-form-mobile :deep(.available-time-editor .time-separator) { text-align: center; color: #909399; font-size: 12px; }
  .edit-form-mobile :deep(.available-time-editor .el-time-select) { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
  /* 图片编辑 */
  .edit-form-mobile :deep(.space-images-editor) { display: flex; flex-direction: column; gap: 8px; }
  .edit-form-mobile :deep(.spaces-editor .el-button) { width: 100%; margin-top: 8px; }

  /* ===== 额外强制覆盖 ===== */
  .edit-form-mobile * { max-width: 100% !important; }
  .edit-form-mobile .el-input__wrapper { width: 100% !important; }
  .edit-form-mobile .el-input { width: 100% !important; min-width: 0 !important; }
  .edit-form-mobile .el-input-number { width: 100% !important; min-width: 0 !important; }
  .edit-form-mobile .el-input-number__input { width: 100% !important; }
  .edit-form-mobile .el-textarea__inner { width: 100% !important; }
  .edit-form-mobile .el-select { width: 100% !important; min-width: 0 !important; }
  .edit-form-mobile .el-time-select { width: 100% !important; min-width: 0 !important; }
  .edit-form-mobile .el-form-item__content { width: 100% !important; max-width: 100% !important; }
  /* 小区编辑项 - 强制单列 */
  .edit-form-mobile .compounds-editor .compound-item > * { width: 100% !important; margin-right: 0 !important; display: block !important; margin-bottom: 6px !important; }
  .edit-form-mobile .compounds-editor .el-button { width: 100% !important; margin: 8px 0 0 !important; display: block !important; }
  /* 场地编辑卡片 - 强制单列 */
  .edit-form-mobile .space-edit-card > * { max-width: 100% !important; }
  .edit-form-mobile .space-edit-card .el-row { display: flex !important; flex-direction: column !important; }
  .edit-form-mobile .space-edit-card .el-col { max-width: 100% !important; width: 100% !important; padding: 0 !important; display: block !important; }
  .edit-form-mobile .space-edit-card .el-form-item { width: 100% !important; }
  /* 设施选择器 */
  .edit-form-mobile .facility-selector { flex-direction: column !important; align-items: stretch !important; }
  .edit-form-mobile .facility-selector .el-check-tag { width: auto !important; }
  /* 时间选择器 */
  .edit-form-mobile .available-time-editor { flex-direction: column !important; }
  .edit-form-mobile .available-time-editor > * { width: 100% !important; }
  /* 场地添加按钮 */
  .edit-form-mobile .spaces-editor .el-button { width: 100% !important; }

}
</style>

