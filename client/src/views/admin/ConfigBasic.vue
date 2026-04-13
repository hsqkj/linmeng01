<template>
  <div class="config-basic" v-loading="loading">
    <h2>基础数据配置</h2>
    <el-tabs v-model="activeTab">
      <!-- 活动类型 -->
      <el-tab-pane label="活动类型" name="activity">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">活动类型用于社区发布需求时选择，影响智能匹配结果</p>
            <el-button type="primary" @click="openAdd('activityTypes','活动类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="activityTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(activityTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === activityTypes.length - 1" @click="moveDown(activityTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="类型名称" min-width="150">
              <template #default="{ row, $index }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联需求" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(activityTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 需求类型 -->
      <el-tab-pane label="需求类型" name="demand">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">需求类型用于社区发布需求时选择，影响需求广场筛选和智能匹配</p>
            <el-button type="primary" @click="openAdd('demandTypes','需求类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="demandTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(demandTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === demandTypes.length - 1" @click="moveDown(demandTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="类型名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(demandTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 专家类型 -->
      <el-tab-pane label="专家类型" name="expert">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">专家类型用于专家服务类需求中选择</p>
            <el-button type="primary" @click="openAdd('expertTypes','专家类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="expertTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(expertTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === expertTypes.length - 1" @click="moveDown(expertTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="专家类型" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联需求" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(expertTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 行业分类 -->
      <el-tab-pane label="行业分类" name="industry">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">行业分类用于商家注册时选择，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('industryTypes','行业分类')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="industryTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(industryTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === industryTypes.length - 1" @click="moveDown(industryTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="行业名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveTypes" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(industryTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 企业类型 -->
      <el-tab-pane label="企业类型" name="enterprise">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">企业类型用于商家注册时选择，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('enterpriseTypes','企业类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="enterpriseTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(enterpriseTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === enterpriseTypes.length - 1" @click="moveDown(enterpriseTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="类型名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="已关联商家" width="110" align="center" />
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(enterpriseTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 资源类型 -->
      <el-tab-pane label="资源类型" name="resource">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">资源类型用于商家发布资源时选择</p>
            <el-button type="primary" @click="openAdd('resourceTypes','资源类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="resourceTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(resourceTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === resourceTypes.length - 1" @click="moveDown(resourceTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="资源类型" min-width="120">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(resourceTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 专业服务子类型配置（仅当存在"专业服务"类型时显示） -->
        <div v-if="hasResourceType('专业服务')" class="config-section" style="margin-top:20px">
          <div class="section-header">
            <p class="section-desc">专业服务子类型用于商家选择"专业服务"类型时进一步细分服务类别</p>
            <el-button type="primary" @click="openAdd('professionalServiceTypes','专业服务子类型')"><el-icon><Plus /></el-icon> 新增子类型</el-button>
          </div>
          <el-table :data="professionalServiceTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(professionalServiceTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === professionalServiceTypes.length - 1" @click="moveDown(professionalServiceTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="子类型名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(professionalServiceTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 物资类型子配置（仅当存在"物资支持"类型时显示） -->
        <div v-if="hasResourceType('物资支持')" class="config-section" style="margin-top:20px">
          <div class="section-header">
            <p class="section-desc">物资类型用于商家选择"物资支持"类型时进一步细分物资类别</p>
            <el-button type="primary" @click="openAdd('goodsTypes','物资类型')"><el-icon><Plus /></el-icon> 新增物资类型</el-button>
          </div>
          <el-table :data="goodsTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(goodsTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === goodsTypes.length - 1" @click="moveDown(goodsTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="物资类型名称" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="200">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.desc" size="small" @blur="saveInlineEdit(row)" />
                <span v-else style="color:#909399;font-size:13px">{{ row.desc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(goodsTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 社区类型 -->
      <el-tab-pane label="社区类型" name="communityType">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">社区类型用于描述社区特征，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('communityTypes','社区类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="communityTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(communityTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === communityTypes.length - 1" @click="moveDown(communityTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="社区类型" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(communityTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 居民类型 -->
      <el-tab-pane label="居民类型" name="residentType">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">居民类型用于描述居民群体特征，影响智能匹配和筛选</p>
            <el-button type="primary" @click="openAdd('residentTypes','居民类型')"><el-icon><Plus /></el-icon> 新增</el-button>
          </div>
          <el-table :data="residentTypes" stripe border>
            <el-table-column width="100" align="center">
              <template #default="{ $index }">
                <el-button text :disabled="$index === 0" @click="moveUp(residentTypes, $index)" title="上移"><el-icon><Top /></el-icon></el-button>
                <el-button text :disabled="$index === residentTypes.length - 1" @click="moveDown(residentTypes, $index)" title="下移"><el-icon><Bottom /></el-icon></el-button>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="居民类型" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row.editing" v-model="row.name" size="small" @blur="row.editing=false; saveInlineEdit(row)" @keyup.enter="row.editing=false; saveInlineEdit(row)" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80" align="center">
              <template #default="{ row }"><el-switch v-model="row.enabled" @change="saveInlineEdit(row)" /></template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="row.editing=true">编辑</el-button>
                <el-button text type="danger" size="small" @click="deleteItem(residentTypes, row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 行政区划 -->
      <el-tab-pane label="行政区划" name="district">
        <div class="config-section">
          <div class="section-header">
            <p class="section-desc">配置平台服务的城市/区/街道/社区四级行政区划数据</p>
            <el-button type="primary" @click="addDistrict(null, 0)"><el-icon><Plus /></el-icon> 新增城市</el-button>
          </div>
          <el-tree
            v-loading="districtLoading"
            :data="districtTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            default-expand-all
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon style="margin-right:4px;color:#909399"><Location /></el-icon>
                <span v-if="!data.editing">{{ node.label }}</span>
                <el-input v-else v-model="data.name" size="small" style="width:150px" @blur="saveDistrictEdit(data)" @keyup.enter="saveDistrictEdit(data)" />
                <span v-if="levelName(data, data.parent_id)" class="tree-level">[{{ levelName(data, data.parent_id) }}]</span>
                <span class="tree-actions">
                  <el-button text type="primary" size="small" @click.stop="data.editing=true">编辑</el-button>
                  <el-button v-if="data.level < 4" text type="success" size="small" @click.stop="addDistrict(data, data.level)">
                    {{ data.level === 1 ? '加区' : data.level === 2 ? '加街道' : data.level === 3 ? '加社区' : '加节点' }}
                  </el-button>
                  <el-button text type="danger" size="small" @click.stop="deleteDistrict(data, node)">删除</el-button>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增弹窗 -->
    <el-dialog v-model="showAddDialog" :title="'新增' + addDialogTitle" width="440px">
      <el-form label-position="top">
        <el-form-item :label="addDialogTitle + '名称'" required>
          <el-input v-model="newItemName" :placeholder="'请输入' + addDialogTitle + '名称'" />
        </el-form-item>
        <el-form-item label="说明（选填）">
          <el-input v-model="newItemDesc" type="textarea" :rows="2" placeholder="可选填写说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 新增行政区划弹窗 -->
    <el-dialog v-model="showDistrictDialog" :title="districtDialogTitle" width="400px">
      <el-form label-position="top">
        <el-form-item :label="districtLabel + '名称'" required>
          <el-input v-model="newDistrictName" :placeholder="'请输入' + districtLabel + '名称'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDistrictDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDistrict">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Location, Top, Bottom } from '@element-plus/icons-vue'
import { getRegions, createRegion, updateRegion, deleteRegion as deleteRegionApi, getBasicTypesConfig, saveBasicTypesConfig } from '@/api/admin'

const loading = ref(false)
const activeTab = ref('activity')
const showAddDialog = ref(false), addDialogTitle = ref(''), newItemName = ref(''), newItemDesc = ref(''), currentList = ref(null)
const showDistrictDialog = ref(false), districtDialogTitle = ref(''), districtLabel = ref(''), newDistrictName = ref('')
const districtParent = ref(null), districtLevel = ref(0)
const districtLoading = ref(false)
// 区(1)、街道(2)、社区(3)，城市级(parent_id=0)直接显示名称不加后缀
const levelName = (data, parentId) => {
  if (!parentId || parentId === 0) return ''  // 顶级城市不显示层级
  return { 2: '区', 3: '街道', 4: '社区' }[data.level] || ''
}

const activityTypes = ref([])
const demandTypes = ref([])
const enterpriseTypes = ref([])
const resourceTypes = ref([])
const expertTypes = ref([])
const industryTypes = ref([])
const communityTypes = ref([])
const residentTypes = ref([])
const professionalServiceTypes = ref([]) // 专业服务子类型
const goodsTypes = ref([]) // 物资类型
const districtTree = ref([])

// 检查是否存在指定名称的资源类型
function hasResourceType(name) {
  return resourceTypes.value.some(t => t.name === name && t.enabled !== false)
}

async function loadBasicTypes() {
  loading.value = true
  try {
    const res = await getBasicTypesConfig()
    const data = res.data || {}

    const defaultActivityTypes = [
      { name: '社区文化活动', desc: '居民文艺演出、节庆活动等', count: 0, enabled: true },
      { name: '教育培训', desc: '公益课、讲座、培训等活动', count: 0, enabled: true },
      { name: '健康运动', desc: '健身、太极、广场舞等体育活动', count: 0, enabled: true },
      { name: '志愿服务', desc: '社区公益服务、义务劳动等', count: 0, enabled: true },
      { name: '便民服务', desc: '理发、缝补、维修等便民活动', count: 0, enabled: true },
      { name: '专家咨询', desc: '法律、心理、医疗等专业咨询', count: 0, enabled: true },
    ]
    const defaultEnterpriseTypes = [
      { name: '国有企业', count: 0, enabled: true },
      { name: '民营企业', count: 0, enabled: true },
      { name: '外资企业', count: 0, enabled: true },
      { name: '个体工商户', count: 0, enabled: true },
      { name: '社会企业', count: 0, enabled: true },
      { name: '非营利组织', count: 0, enabled: true },
    ]
    const defaultResourceTypes = [
      { name: '资金支持', desc: '活动经费、奖金等资金支持', enabled: true },
      { name: '物资支持', desc: '图书、设备、食品等物资', enabled: true },
      { name: '人力服务', desc: '人力支持、活动协助等', enabled: true },
      { name: '技术服务', desc: 'IT、网络、设备维护等技术支持', enabled: true },
      { name: '媒体宣传', desc: '公众号、媒体推广等服务', enabled: true },
      { name: '其他', desc: '其他类型的资源支持', enabled: true },
    ]
    const defaultExpertTypes = [
      { name: '法律咨询', desc: '法律顾问、纠纷调解等服务', count: 0, enabled: true },
      { name: '心理健康', desc: '心理咨询、心理辅导等服务', count: 0, enabled: true },
      { name: '医疗健康', desc: '义诊、健康讲座等服务', count: 0, enabled: true },
      { name: '财务税务', desc: '财税顾问、代理记账等服务', count: 0, enabled: true },
      { name: '工程技术', desc: '水电维修、网络技术等服务', count: 0, enabled: true },
    ]
    const defaultIndustryTypes = [
      '教育培训', '医院诊所', '药店', '餐饮小吃', '生鲜水果',
      '美业', '保健养生', '体育健身', '银行保险', '电信服务',
      '商超零售', '快递物流', '家政服务', '废旧回收', '五金建材',
      '家居装修', '家纺布艺', '电子电器', '房产中介', '汽车服务',
      '旅游服务', '鲜花礼品', '电影演出', '娱乐休闲', '服装服饰',
      '酒店宾馆', '茶艺咖啡', '宠物服务', '眼镜', '酒水饮料',
      '办公用品', '设备租赁', '社工服务', '养老服务', '新闻媒体',
      '自媒体', 'IT互联网', '软件开发', '图文广告', '电子电器维修',
      '家居维修', '美发', '建筑工程', '其他'
    ].map(name => ({ name, enabled: true, editing: false }))

    if (!data.activityTypes || data.activityTypes.length === 0) {
      activityTypes.value = defaultActivityTypes.map(t => ({ ...t, editing: false }))
    } else {
      activityTypes.value = data.activityTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    // 需求类型（9种）
    const defaultDemandTypes = [
      { name: '活动赞助', desc: '需要资金、物资、人力等赞助支持', count: 0, enabled: true },
      { name: '专家服务', desc: '需要法律、心理、医疗等专业咨询', count: 0, enabled: true },
      { name: '空间运营', desc: '需要场地、活动室等空间资源', count: 0, enabled: true },
      { name: '物资赞助', desc: '需要图书、设备、食品等物资支持', count: 0, enabled: true },
      { name: '健康服务', desc: '需要健康讲座、义诊等服务', count: 0, enabled: true },
      { name: '教育培训', desc: '需要课程、培训、托管等服务', count: 0, enabled: true },
      { name: '志愿服务', desc: '需要志愿者、活动协助等支持', count: 0, enabled: true },
      { name: '文化活动', desc: '需要文艺演出、节庆活动等支持', count: 0, enabled: true },
      { name: '技术咨询', desc: '需要软件开发、系统维护等技术支持', count: 0, enabled: true },
    ].map(t => ({ ...t, editing: false }))

    if (!data.demandTypes || data.demandTypes.length === 0) {
      demandTypes.value = defaultDemandTypes
    } else {
      demandTypes.value = data.demandTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.expertTypes || data.expertTypes.length === 0) {
      expertTypes.value = defaultExpertTypes.map(t => ({ ...t, editing: false }))
    } else {
      expertTypes.value = data.expertTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.enterpriseTypes || data.enterpriseTypes.length === 0) {
      enterpriseTypes.value = defaultEnterpriseTypes.map(t => ({ ...t, editing: false }))
    } else {
      enterpriseTypes.value = data.enterpriseTypes.map(t => ({ ...t, count: t.count || 0, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.resourceTypes || data.resourceTypes.length === 0) {
      resourceTypes.value = defaultResourceTypes.map(t => ({ ...t, editing: false }))
    } else {
      resourceTypes.value = data.resourceTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    if (!data.industryTypes || data.industryTypes.length === 0) {
      industryTypes.value = defaultIndustryTypes
    } else {
      industryTypes.value = data.industryTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    // 社区类型
    const defaultCommunityTypes = [
      { name: '老旧小区', enabled: true },
      { name: '新建社区', enabled: true },
      { name: '亲子社区', enabled: true },
      { name: '老龄化社区', enabled: true },
      { name: '学区社区', enabled: true },
      { name: '商圈社区', enabled: true },
      { name: '文化社区', enabled: true },
      { name: '体育社区', enabled: true },
      { name: '绿色社区', enabled: true },
    ].map(name => ({ name, enabled: true, editing: false }))

    if (!data.communityTypes || data.communityTypes.length === 0) {
      communityTypes.value = defaultCommunityTypes
    } else {
      communityTypes.value = data.communityTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    // 居民类型
    const defaultResidentTypes = [
      { name: '青少年/儿童', enabled: true },
      { name: '青年', enabled: true },
      { name: '中老年', enabled: true },
      { name: '宝妈', enabled: true },
      { name: '退役军人', enabled: true },
      { name: '残疾群体', enabled: true },
      { name: '困难家庭', enabled: true },
    ].map(name => ({ name, enabled: true, editing: false }))

    if (!data.residentTypes || data.residentTypes.length === 0) {
      residentTypes.value = defaultResidentTypes
    } else {
      residentTypes.value = data.residentTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    // 专业服务子类型
    const defaultProfessionalServiceTypes = [
      { name: '法律咨询', desc: '法律顾问、纠纷调解、法律援助等', enabled: true },
      { name: '心理咨询', desc: '心理咨询、心理辅导、情绪疏导等', enabled: true },
      { name: '健康医疗', desc: '义诊、健康讲座、康复指导等', enabled: true },
      { name: '活动策划', desc: '活动策划、执行指导、现场协助等', enabled: true },
      { name: '教育培训', desc: '课程讲授、技能培训、讲座等', enabled: true },
      { name: '设计服务', desc: '海报设计、VI设计、宣传物料等', enabled: true },
      { name: 'IT技术', desc: '软件开发、网络维护、电脑维修等', enabled: true },
      { name: '财务税务', desc: '财税顾问、代理记账、税务筹划等', enabled: true },
      { name: '工程维修', desc: '水电维修、门窗修理、管道疏通等', enabled: true },
      { name: '摄影摄像', desc: '活动摄影、视频拍摄、后期制作等', enabled: true },
      { name: '文艺指导', desc: '舞蹈编排、合唱指导、节目编排等', enabled: true },
      { name: '其他专业', desc: '其他专业服务', enabled: true },
    ].map(t => ({ ...t, editing: false }))

    if (!data.professionalServiceTypes || data.professionalServiceTypes.length === 0) {
      professionalServiceTypes.value = defaultProfessionalServiceTypes
    } else {
      professionalServiceTypes.value = data.professionalServiceTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }

    // 物资类型
    const defaultGoodsTypes = [
      { name: '图书绘本', desc: '儿童绘本、文学书籍等', enabled: true },
      { name: '食品饮料', desc: '矿泉水、饮料、水果、零食等', enabled: true },
      { name: '文体用品', desc: '笔、本子、文具等', enabled: true },
      { name: '生活用品', desc: '日用品、家居用品等', enabled: true },
      { name: '电子设备', desc: '电脑、投影仪、音响等', enabled: true },
      { name: '活动物料', desc: '横幅、气球、彩旗等', enabled: true },
      { name: '防疫物资', desc: '口罩、消毒液等', enabled: true },
      { name: '服装鞋帽', desc: '服装、鞋子、帽子等', enabled: true },
      { name: '玩具礼品', desc: '玩具、奖品、礼品等', enabled: true },
      { name: '交通工具', desc: '车辆、电动车等', enabled: true },
      { name: '优惠券券', desc: '优惠券、兑换券等', enabled: true },
      { name: '其他物资', desc: '其他物资', enabled: true },
    ].map(t => ({ ...t, editing: false }))

    if (!data.goodsTypes || data.goodsTypes.length === 0) {
      goodsTypes.value = defaultGoodsTypes
    } else {
      goodsTypes.value = data.goodsTypes.map(t => ({ ...t, enabled: t.enabled !== false, editing: false }))
    }
  } catch {}
  finally { loading.value = false }
}

async function saveTypes() {
  await saveBasicTypesConfig({
    activityTypes: activityTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    demandTypes: demandTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    enterpriseTypes: enterpriseTypes.value.map(t => ({ name: t.name, enabled: t.enabled })),
    resourceTypes: resourceTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    expertTypes: expertTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    industryTypes: industryTypes.value.map(t => ({ name: t.name, enabled: t.enabled })),
    communityTypes: communityTypes.value.map(t => ({ name: t.name, enabled: t.enabled })),
    residentTypes: residentTypes.value.map(t => ({ name: t.name, enabled: t.enabled })),
    professionalServiceTypes: professionalServiceTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled })),
    goodsTypes: goodsTypes.value.map(t => ({ name: t.name, desc: t.desc, enabled: t.enabled }))
  })
}

async function loadDistrictTree() {
  districtLoading.value = true
  try {
    const res = await getRegions()
    const regions = res.data || []
    // Build tree from flat list
    const map = {}
    const roots = []
    regions.forEach(r => { map[r.id] = { ...r, editing: false, children: [] } })
    regions.forEach(r => {
      if (r.parent_id === 0 || r.parent_id === null || r.parent_id === undefined) {
        roots.push(map[r.id])
      } else if (map[r.parent_id]) {
        map[r.parent_id].children.push(map[r.id])
      }
    })
    districtTree.value = roots
  } catch {
    districtTree.value = []
  } finally {
    districtLoading.value = false
  }
}

function openAdd(listName, title) {
  addDialogTitle.value = title
  currentList.value = listName
  newItemName.value = ''
  newItemDesc.value = ''
  showAddDialog.value = true
}

async function confirmAdd() {
  if (!newItemName.value.trim()) { ElMessage.warning('请输入名称'); return }
  const lists = { activityTypes, demandTypes, enterpriseTypes, resourceTypes, expertTypes, industryTypes, communityTypes, residentTypes, professionalServiceTypes, goodsTypes }
  const listRef = lists[currentList.value]
  if (listRef) {
    const item = { name: newItemName.value.trim(), count: 0, enabled: true, editing: false, desc: newItemDesc.value }
    listRef.value.push(item)
    try {
      await saveTypes()
      ElMessage.success('添加成功')
    } catch {
      listRef.value.pop()
      ElMessage.error('添加失败，请重试')
      return
    }
  }
  showAddDialog.value = false
}

async function saveInlineEdit(row) {
  try {
    await saveTypes()
    ElMessage.success('已更新')
  } catch {
    ElMessage.error('更新失败')
  }
}

// 移动项目
function moveUp(arr, index) {
  if (index <= 0) return
  const temp = arr[index - 1]
  arr[index - 1] = arr[index]
  arr[index] = temp
  saveTypes()
  ElMessage.success('已上移')
}

function moveDown(arr, index) {
  if (index >= arr.length - 1) return
  const temp = arr[index + 1]
  arr[index + 1] = arr[index]
  arr[index] = temp
  saveTypes()
  ElMessage.success('已下移')
}

async function deleteItem(arr, row) {
  ElMessageBox.confirm(`确认删除"${row.name}"？`, '删除确认', { type: 'warning' })
    .then(async () => {
      const idx = arr.indexOf(row)
      if (idx >= 0) {
        arr.splice(idx, 1)
        try {
          await saveTypes()
          ElMessage.success('已删除')
        } catch {
          arr.splice(idx, 0, row)
          ElMessage.error('删除失败，请重试')
        }
      }
    })
    .catch(() => {})
}

function addDistrict(parent, level) {
  districtParent.value = parent
  districtLevel.value = level
  newDistrictName.value = ''
  // level=0表示顶级（城市/武汉市），level=1表示区，level=2表示街道，level=3表示社区
  const labels = { 0: '城市', 1: '区', 2: '街道', 3: '社区' }
  districtLabel.value = labels[level] || '节点'
  districtDialogTitle.value = parent ? `在"${parent.name}"下新增${districtLabel.value}` : `新增${districtLabel.value}`
  showDistrictDialog.value = true
}

async function saveDistrictEdit(data) {
  if (!data.name.trim()) { ElMessage.warning('名称不能为空'); data.editing = false; loadDistrictTree(); return }
  try {
    await updateRegion(data.id, { name: data.name.trim() })
    data.editing = false
    ElMessage.success('已更新')
  } catch {
    ElMessage.error('更新失败')
    data.editing = false
  }
}

async function confirmAddDistrict() {
  if (!newDistrictName.value.trim()) { ElMessage.warning('请输入名称'); return }
  try {
    const data = { name: newDistrictName.value.trim(), level: districtLevel.value + 1, parent_id: districtParent.value ? districtParent.value.id : 0 }
    await createRegion(data)
    ElMessage.success('已添加：' + newDistrictName.value)
    showDistrictDialog.value = false
    loadDistrictTree()
  } catch {
    ElMessage.error('添加失败，请重试')
  }
}

async function deleteDistrict(data, node) {
  const hasChildren = data.children && data.children.length > 0
  const msg = hasChildren ? `"${data.name}"下还有子节点，删除后子节点也将一并删除。确认删除？` : `确认删除"${data.name}"？`
  try {
    await ElMessageBox.confirm(msg, '删除确认', { type: 'warning' })
    await deleteRegionApi(data.id)
    ElMessage.success('已删除')
    loadDistrictTree()
  } catch {
    // 用户取消或删除失败
  }
}

onMounted(() => { loadBasicTypes(); loadDistrictTree() })
</script>

<style scoped>
.config-basic { max-width: 1000px; margin: 0 auto; }
.config-basic h2 { margin-bottom: 20px; font-size: 22px; font-weight: 700; }
.config-section { background: #fff; border-radius: 12px; padding: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-desc { color: #909399; font-size: 13px; margin: 0; }
.tree-node { display: flex; align-items: center; gap: 4px; width: 100%; }
.tree-level { font-size: 11px; color: #c0c4cc; margin-left: 2px; }
.tree-actions { display: none; gap: 4px; margin-left: 12px; }
.el-tree-node__content:hover .tree-actions { display: flex; }

@media (max-width: 768px) {
  .config-basic {
    padding: 12px;
    padding-bottom: 70px;
  }
  .config-basic h2 {
    font-size: 18px;
    margin-bottom: 14px;
  }
  :deep(.el-tabs__nav) {
    font-size: 13px;
    flex-wrap: wrap;
  }
  .config-section {
    padding: 12px;
    border-radius: 8px;
  }
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
  }
  .section-header .el-button {
    width: 100%;
    font-size: 13px;
  }
  .section-desc {
    font-size: 12px;
  }
  :deep(.el-table) {
    font-size: 11px;
  }
  :deep(.el-table__header th) {
    font-size: 10px;
    padding: 6px 3px;
  }
  :deep(.el-table__body td) {
    padding: 6px 3px;
  }
  :deep(.el-tree) {
    font-size: 12px;
  }
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 440px;
  }
  :deep(.el-dialog__body) {
    padding: 12px;
  }
}
</style>
