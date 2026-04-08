<template>
  <div class="publish-demand">
    <div class="page-header">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>发布社区需求</h2>
      <el-button type="info" plain @click="$router.push('/community/demands/batch')">
        <el-icon><Upload /></el-icon> 批量导入
      </el-button>
    </div>

    <el-steps :active="activeStep" finish-status="success" class="steps">
      <el-step title="选择类型" />
      <el-step title="填写信息" />
      <el-step title="设置回报" />
      <el-step title="提交审核" />
    </el-steps>

    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="demand-form">

      <!-- 步骤1：选择类型 -->
      <div v-if="activeStep === 0" class="step-content">
        <h3>请选择需求类型</h3>
        <p class="step-tip">💡 选择最符合您需求的类型，有助于精准匹配合适商家资源</p>
        <div class="type-cards">
          <div class="type-card" :class="{ active: form.type === 'activity' }" @click="form.type = 'activity'">
            <el-icon :size="44" color="#409EFF"><Calendar /></el-icon>
            <h4>活动赞助</h4>
            <p>举办社区活动，寻求资金、物资、人力、技术、媒体等多类型支持</p>
            <div class="check-badge" v-if="form.type === 'activity'">✓ 已选</div>
          </div>
          <div class="type-card" :class="{ active: form.type === 'expert' }" @click="form.type = 'expert'">
            <el-icon :size="44" color="#67C23A"><UserFilled /></el-icon>
            <h4>专家服务</h4>
            <p>邀请专业人士提供法律、医疗、教育、心理等专业服务</p>
            <div class="check-badge" v-if="form.type === 'expert'">✓ 已选</div>
          </div>
          <div class="type-card" :class="{ active: form.type === 'space' }" @click="form.type = 'space'">
            <el-icon :size="44" color="#E6A23C"><OfficeBuilding /></el-icon>
            <h4>空间运营</h4>
            <p>社区公共空间寻求合作运营、改造共建或品牌冠名</p>
            <div class="check-badge" v-if="form.type === 'space'">✓ 已选</div>
          </div>
        </div>
      </div>

      <!-- 步骤2：活动赞助 - 填写信息 -->
      <div v-if="activeStep === 1 && form.type === 'activity'" class="step-content">
        <div class="form-tip-box">💡 填写越准确，匹配越精准，吸引优质商家的概率越高！</div>

        <el-form-item label="活动名称" prop="activityName" required>
          <el-input v-model="form.activityName" placeholder="请填写活动全称，便于商家了解活动性质" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="活动类型" prop="activityType" required>
          <el-select v-model="form.activityType" placeholder="请选择活动类型" style="width:100%">
            <el-option v-for="t in activityTypes" :key="t" :label="t" :value="t" />
          </el-select>
          <div class="field-tip">📋 活动类型用于精准匹配擅长该类活动的商家资源</div>
        </el-form-item>

        <el-form-item label="目标对象" prop="targetGroups" required>
          <div class="tag-selector">
            <el-check-tag
              v-for="g in targetGroupOptions"
              :key="g"
              :checked="form.targetGroups.includes(g)"
              @change="toggleTag(form.targetGroups, g)"
              class="selector-tag"
            >{{ g }}</el-check-tag>
          </div>
          <div class="field-tip">🎯 明确受益群体，商家可针对性安排资源（可多选）</div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="活动开始时间" prop="startTime" required>
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                style="width:100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled-hours="disabledHours"
                :disabled-minutes="disabledMinutes"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动结束时间" prop="endTime" required>
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                style="width:100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled-hours="disabledHours"
                :disabled-minutes="disabledMinutes"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="field-tip">⏰ 时间精确到分，分钟按10分钟一档选择</div>

        <el-form-item label="活动地点类型" prop="venueType" required>
          <el-radio-group v-model="form.venueType">
            <el-radio-button label="indoor">🏠 室内</el-radio-button>
            <el-radio-button label="outdoor">🌳 室外</el-radio-button>
          </el-radio-group>
          <div class="field-tip">📍 室内/室外场景对商家的展示方式和资源安排有所不同</div>
        </el-form-item>

        <el-form-item label="活动地点名称" prop="venue" required>
          <el-input v-model="form.venue" placeholder="如：社区活动中心、南门户外广场" />
        </el-form-item>

        <el-form-item label="预计参与人数" prop="expectedAttendees" required>
          <el-input-number v-model="form.expectedAttendees" :min="1" :max="100000" style="width:100%" />
          <div class="field-tip">👥 预估参与人数有助于商家评估曝光效益和资源投入</div>
        </el-form-item>

        <el-form-item label="活动简介" prop="description" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="请详细描述活动内容、亮点和社会意义。内容越详尽，越能吸引优质商家参与！"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="活动标签" prop="tags">
          <div class="tag-selector">
            <el-check-tag
              v-for="tag in communityTagOptions"
              :key="tag"
              :checked="form.tags.includes(tag)"
              @change="toggleTag(form.tags, tag)"
              class="selector-tag"
            >{{ tag }}</el-check-tag>
            <el-input
              v-model="customTag"
              placeholder="输入自定义标签"
              style="width:160px;margin-left:8px"
              size="small"
              @keyup.enter="addCustomTag"
            >
              <template #append>
                <el-button @click="addCustomTag" size="small">+添加</el-button>
              </template>
            </el-input>
          </div>
          <div class="selected-tags" v-if="form.tags.length > 0">
            已选标签：
            <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(form.tags, tag)" type="primary" effect="light" size="small">{{ tag }}</el-tag>
          </div>
          <div class="field-tip">🏷️ 标签用于智能匹配，选择越准确匹配精度越高（支持多选）</div>
        </el-form-item>

        <el-form-item label="策划方案（选填）">
          <el-upload drag accept=".pdf,.doc,.docx,.ppt,.pptx" :auto-upload="false" :on-change="handlePlanFile">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件至此，或 <em>点击上传</em></div>
            <template #tip><div class="el-upload__tip">支持PDF/Word/PPT，有策划方案可大大提升商家信任度</div></template>
          </el-upload>
        </el-form-item>

        <!-- 所需赞助类型 -->
        <div class="section-divider">所需赞助</div>
        <el-form-item label="赞助类型" prop="sponsorTypes" required>
          <div class="tag-selector">
            <el-check-tag
              v-for="st in sponsorTypeOptions"
              :key="st.value"
              :checked="form.sponsorTypes.includes(st.value)"
              @change="toggleTag(form.sponsorTypes, st.value)"
              class="selector-tag"
            >{{ st.label }}</el-check-tag>
          </div>
          <div class="field-tip">💰 可同时选择多种赞助类型，每种类型会显示对应填写项</div>
        </el-form-item>

        <!-- 资金 -->
        <div v-if="form.sponsorTypes.includes('fund')" class="sponsor-block fund-block">
          <div class="block-title">💵 资金赞助详情</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="所需最低金额（元）">
                <el-input-number v-model="form.fundMin" :min="0" style="width:100%" placeholder="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所需最高金额（元）">
                <el-input-number v-model="form.fundMax" :min="0" style="width:100%" placeholder="50000" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="资金用途说明">
            <el-input v-model="form.fundUsage" type="textarea" :rows="3" placeholder="请说明资金的具体用途，如：30%用于场地布置，30%用于物料制作，40%用于礼品采购。说明越详细，商家越放心！" />
          </el-form-item>
        </div>

        <!-- 物资 -->
        <div v-if="form.sponsorTypes.includes('goods')" class="sponsor-block goods-block">
          <div class="block-title">📦 物资赞助详情</div>
          <el-form-item label="物资清单">
            <el-input v-model="form.goodsList" type="textarea" :rows="4" placeholder="请尽量列出详细的物资清单，例如：
- 矿泉水 500ml×200瓶
- 活动T恤 S/M/L各50件
- 气球 100个
越详细的清单越能吸引有对应库存的商家！" />
          </el-form-item>
          <el-form-item label="配送/领取方式">
            <el-radio-group v-model="form.goodsDelivery">
              <el-radio label="self">商家自行配送</el-radio>
              <el-radio label="pickup">社区自取</el-radio>
              <el-radio label="both">均可</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 人力 -->
        <div v-if="form.sponsorTypes.includes('manpower')" class="sponsor-block manpower-block">
          <div class="block-title">👥 人力支持详情</div>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="所需人数">
                <el-input-number v-model="form.manpowerCount" :min="1" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="服务时长（小时）">
                <el-input-number v-model="form.manpowerHours" :min="0.5" :step="0.5" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="工作内容描述">
            <el-input v-model="form.manpowerContent" type="textarea" :rows="3" placeholder="请明确岗位职责，如：需要2名主持人（普通话标准）、3名现场引导员、1名摄影师。明确职责有助于商家安排合适人员！" />
          </el-form-item>
          <el-form-item label="技能要求（选填）">
            <el-input v-model="form.manpowerSkills" placeholder="如：需具备活动主持经验、有急救资质等" />
          </el-form-item>
        </div>

        <!-- 技术支持 -->
        <div v-if="form.sponsorTypes.includes('tech')" class="sponsor-block tech-block">
          <div class="block-title">💻 技术支持详情</div>
          <el-form-item label="技术类型">
            <el-checkbox-group v-model="form.techTypes">
              <el-checkbox label="equipment">设备器材</el-checkbox>
              <el-checkbox label="software">软件系统</el-checkbox>
              <el-checkbox label="network">网络通信</el-checkbox>
              <el-checkbox label="av">音视频</el-checkbox>
              <el-checkbox label="other">其他</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="具体需求描述">
            <el-input v-model="form.techDesc" type="textarea" :rows="3" placeholder="如有设备需求请说明品牌/型号，如：需要2个专业音响系统（额定功率500W以上）、1套专业打光设备。具体描述有助于精准匹配！" />
          </el-form-item>
        </div>

        <!-- 媒体报道 -->
        <div v-if="form.sponsorTypes.includes('media')" class="sponsor-block media-block">
          <div class="block-title">📰 媒体报道详情</div>
          <el-form-item label="期望报道媒体类型">
            <el-checkbox-group v-model="form.mediaTypes">
              <el-checkbox label="news">新闻网站</el-checkbox>
              <el-checkbox label="wechat">微信公众号</el-checkbox>
              <el-checkbox label="video">短视频（抖音/视频号）</el-checkbox>
              <el-checkbox label="tv">电视/广播</el-checkbox>
              <el-checkbox label="paper">报纸</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="报道形式说明">
            <el-input v-model="form.mediaDesc" type="textarea" :rows="3" placeholder="如：希望有活动前预告推文（阅读量5000+）和活动后总结推文，以及2条短视频内容。媒体覆盖范围越广，商家参与意愿越高！" />
          </el-form-item>
          <el-form-item label="预期发布时间">
            <el-date-picker v-model="form.mediaPublishTime" type="date" placeholder="预期报道发布日期" style="width:100%" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
          </el-form-item>
        </div>
      </div>

      <!-- 步骤2：专家服务 - 填写信息 -->
      <div v-if="activeStep === 1 && form.type === 'expert'" class="step-content">
        <div class="form-tip-box">💡 填写越准确，匹配越精准，吸引优质专家资源的概率越高！</div>

        <el-form-item label="专家类型" prop="expertType" required>
          <el-select v-model="form.expertType" placeholder="请选择所需专家类型" style="width:100%">
            <el-option v-for="t in expertTypes" :key="t" :label="t" :value="t" />
          </el-select>
          <div class="field-tip">🎓 专家类型决定匹配方向，请选择最匹配的类型</div>
        </el-form-item>

        <el-form-item label="目标服务对象" required>
          <div class="tag-selector">
            <el-check-tag v-for="g in targetGroupOptions" :key="g" :checked="form.targetGroups.includes(g)" @change="toggleTag(form.targetGroups, g)" class="selector-tag">{{ g }}</el-check-tag>
          </div>
          <div class="field-tip">🎯 明确受益群体有助于精准匹配对应专家（可多选）</div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务开始时间" required>
              <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" :disabled-hours="disabledHours" :disabled-minutes="disabledMinutes" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务结束时间" required>
              <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width:100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" :disabled-hours="disabledHours" :disabled-minutes="disabledMinutes" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="field-tip">⏰ 请尽量提前预约，便于商家安排专家档期（时间精确到10分钟）</div>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="服务频次">
              <el-select v-model="form.frequency" placeholder="选择" style="width:100%">
                <el-option label="一次性服务" value="once" />
                <el-option label="每周一次" value="weekly" />
                <el-option label="每两周一次" value="biweekly" />
                <el-option label="每月一次" value="monthly" />
                <el-option label="其他（详见备注）" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="需要专家人数">
              <el-input-number v-model="form.expertCount" :min="1" :max="50" style="width:100%" />
              <div class="field-tip">如需多人请在备注中说明各自职责</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否需要上门服务">
              <el-radio-group v-model="form.needVisit">
                <el-radio label="yes">是</el-radio>
                <el-radio label="no">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="期望费用">
          <el-select v-model="form.fee" placeholder="请选择" style="width:200px">
            <el-option label="免费" value="free" />
            <el-option label="有偿" value="paid" />
            <el-option label="可协商" value="negotiable" />
          </el-select>
          <div class="field-tip">💰 填写预期费用有助于快速与资源方达成一致</div>
        </el-form-item>

        <el-form-item label="专家资质要求（选填）">
          <el-input v-model="form.qualification" placeholder="如：中级心理咨询师、执业律师、主治医师等。有证书要求请注明，有助于匹配有资质的专家！" />
        </el-form-item>

        <el-form-item label="服务地点类型" required>
          <el-radio-group v-model="form.venueType">
            <el-radio-button label="indoor">🏠 室内</el-radio-button>
            <el-radio-button label="outdoor">🌳 室外</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="服务地点" required>
          <el-input v-model="form.venue" placeholder="如：社区活动室、会议室、居家上门" />
        </el-form-item>

        <el-form-item label="服务内容描述" required>
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="请详细描述所需服务内容和期望效果，如：面向60岁以上老年人，开展1次血压/血糖免费检测+健康知识讲座，预计参与50人。描述越详细，匹配越精准！" maxlength="1000" show-word-limit />
        </el-form-item>

        <el-form-item label="活动标签">
          <div class="tag-selector">
            <el-check-tag v-for="tag in communityTagOptions" :key="tag" :checked="form.tags.includes(tag)" @change="toggleTag(form.tags, tag)" class="selector-tag">{{ tag }}</el-check-tag>
          </div>
        </el-form-item>
      </div>

      <!-- 步骤2：空间运营 - 填写信息 -->
      <div v-if="activeStep === 1 && form.type === 'space'" class="step-content">
        <div class="form-tip-box">💡 填写越准确，匹配越精准，吸引优质运营商家的概率越高！</div>

        <el-form-item label="空间名称" required>
          <el-input v-model="form.spaceName" placeholder="请填写准确的空间名称，如：南门广场、2楼多功能活动室、社区便民服务中心" />
          <div class="field-tip">📋 准确的名称有助于商家了解空间位置和属性</div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="空间面积（㎡）" required>
              <el-input-number v-model="form.spaceArea" :min="1" style="width:100%" />
              <div class="field-tip">准确面积有助于商家评估承载能力</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="空间类型" required>
              <el-radio-group v-model="form.venueType">
                <el-radio label="indoor">室内</el-radio>
                <el-radio label="outdoor">室外</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="空间类别（可多选）">
          <el-checkbox-group v-model="form.spaceTypes">
            <el-checkbox label="square">广场</el-checkbox>
            <el-checkbox label="room">活动室</el-checkbox>
            <el-checkbox label="show">展示空间</el-checkbox>
            <el-checkbox label="commercial">商业街区</el-checkbox>
            <el-checkbox label="parking">停车场</el-checkbox>
            <el-checkbox label="other">其他</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="现有设施（可多选）">
          <el-checkbox-group v-model="form.facilities">
            <el-checkbox label="chairs">桌椅</el-checkbox>
            <el-checkbox label="audio">音响</el-checkbox>
            <el-checkbox label="projector">投影</el-checkbox>
            <el-checkbox label="power">电源</el-checkbox>
            <el-checkbox label="wifi">WiFi</el-checkbox>
            <el-checkbox label="parking">停车位</el-checkbox>
            <el-checkbox label="storage">储物空间</el-checkbox>
          </el-checkbox-group>
          <div class="field-tip">🏗️ 勾选已有设施，商家可针对性提供补充资源</div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开放开始时间">
              <el-time-picker v-model="form.openStart" placeholder="开放开始" style="width:100%" format="HH:mm" value-format="HH:mm" :minutes="[0,10,20,30,40,50]" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开放结束时间">
              <el-time-picker v-model="form.openEnd" placeholder="开放结束" style="width:100%" format="HH:mm" value-format="HH:mm" :minutes="[0,10,20,30,40,50]" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="期望合作形式（可多选）">
          <el-checkbox-group v-model="form.cooperationTypes">
            <el-checkbox label="naming">品牌冠名</el-checkbox>
            <el-checkbox label="build">场地共建/改造</el-checkbox>
            <el-checkbox label="joint">联营经营</el-checkbox>
            <el-checkbox label="trust">委托托管</el-checkbox>
            <el-checkbox label="activity">定期活动合作</el-checkbox>
            <el-checkbox label="other">其他</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="空间简介" required>
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="描述空间特色、适用场景、周边人流量、社区基本情况等。内容越详尽，越能吸引优质运营商家！" maxlength="1000" show-word-limit />
        </el-form-item>

        <el-form-item label="空间实景图片" required>
          <el-upload
            v-model:file-list="form.spaceImages"
            list-type="picture-card"
            :auto-upload="false"
            :limit="9"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">上传真实清晰的空间照片，让商家直观了解空间条件（最多9张）</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="活动标签">
          <div class="tag-selector">
            <el-check-tag v-for="tag in communityTagOptions" :key="tag" :checked="form.tags.includes(tag)" @change="toggleTag(form.tags, tag)" class="selector-tag">{{ tag }}</el-check-tag>
          </div>
        </el-form-item>
      </div>

      <!-- 步骤3：设置商家回报（活动和专家服务） -->
      <div v-if="activeStep === 2 && form.type !== 'space'" class="step-content">
        <div class="form-tip-box">💡 商家回报是吸引商家参与的关键！请尽量提供有价值的回报方式</div>
        <h3>设置商家回报</h3>

        <el-form-item label="品牌曝光方式（多选）" required>
          <div class="tag-selector reward-tags">
            <el-check-tag v-for="r in rewardOptions" :key="r" :checked="form.rewards.includes(r)" @change="toggleTag(form.rewards, r)" class="selector-tag">{{ r }}</el-check-tag>
          </div>
          <div class="field-tip">🏆 选择越多种回报方式，对商家的吸引力越大（可多选）</div>
        </el-form-item>

        <el-form-item label="自定义回报（选填）">
          <el-input v-model="form.customReward" placeholder="如：赠送社区月度报告、优先合作权等" />
        </el-form-item>

        <el-form-item label="回报价值说明" required>
          <el-input v-model="form.rewardDesc" type="textarea" :rows="4" placeholder="请填写量化的回报数据，如：
- 覆盖居民户数：约800户
- 社区微信公众号粉丝：3500人
- 业主群共8个，成员约1200人
- 宣传横幅展示位于主入口，日均流量约500人
量化指标让商家更清晰地评估投入产出！" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item label="活动现场图片（让商家直观了解活动氛围）">
          <el-upload
            v-model:file-list="form.activityImages"
            list-type="picture-card"
            :auto-upload="false"
            :limit="9"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">上传往期活动照片或场地照片，视觉展示最有说服力！（最多9张，支持JPG/PNG）</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="截止日期">
          <el-date-picker v-model="form.deadline" type="date" placeholder="赞助招募截止日期" style="width:100%" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
          <div class="field-tip">📅 设置截止日期可以制造紧迫感，提高商家响应速度</div>
        </el-form-item>
      </div>

      <!-- 步骤3：空间运营的回报 -->
      <div v-if="activeStep === 2 && form.type === 'space'" class="step-content">
        <div class="form-tip-box">💡 商家回报是吸引合作伙伴的关键！请清晰说明商家能获得的权益</div>
        <h3>设置商家回报</h3>

        <el-form-item label="场地使用权限说明">
          <el-input v-model="form.spaceUsageDesc" type="textarea" :rows="3" placeholder="如：每周六14:00-18:00可使用室外广场举办活动，每月可举办2次主题活动" />
        </el-form-item>

        <el-form-item label="品牌展示方式（多选）">
          <el-checkbox-group v-model="form.brandDisplayTypes">
            <el-checkbox label="sign">冠名牌/标识</el-checkbox>
            <el-checkbox label="rack">展示架</el-checkbox>
            <el-checkbox label="board">宣传栏</el-checkbox>
            <el-checkbox label="screen">数字屏</el-checkbox>
            <el-checkbox label="other">其他</el-checkbox>
          </el-checkbox-group>
          <div class="field-tip">📢 清晰的品牌展示方式有助于商家做投入产出评估</div>
        </el-form-item>

        <el-form-item label="其他回报说明">
          <el-input v-model="form.rewardDesc" type="textarea" :rows="3" placeholder="如：优先获得社区活动合作邀请、社区公众号定期推文宣传、居民优先推荐等。量化效果更有说服力！" />
        </el-form-item>

        <el-form-item label="空间实景图片（可补充上传）">
          <el-upload v-model:file-list="form.activityImages" list-type="picture-card" :auto-upload="false" :limit="9" accept="image/*">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </div>

      <!-- 步骤4：提交审核 -->
      <div v-if="activeStep === 3" class="step-content">
        <div class="submit-preview">
          <el-result
            icon="success"
            title="信息填写完成！"
            sub-title="请确认以下信息，提交后将进入人工审核（通常2小时内完成）"
          >
            <template #extra>
              <div class="preview-card">
                <div class="preview-item"><span class="label">需求类型：</span>{{ typeLabels[form.type] }}</div>
                <div class="preview-item"><span class="label">需求名称：</span>{{ form.activityName || form.expertType || form.spaceName }}</div>
                <div class="preview-item" v-if="form.startTime"><span class="label">时间：</span>{{ form.startTime }} ~ {{ form.endTime }}</div>
                <div class="preview-item" v-if="form.venue"><span class="label">地点：</span>{{ venueTypeLabel }} · {{ form.venue }}</div>
                <div class="preview-item" v-if="form.sponsorTypes.length > 0"><span class="label">赞助类型：</span>{{ form.sponsorTypes.map(s => sponsorTypeLabels[s]).join('、') }}</div>
                <div class="preview-item" v-if="form.rewards.length > 0"><span class="label">商家回报：</span>{{ form.rewards.slice(0,3).join('、') }}{{ form.rewards.length > 3 ? '等' : '' }}</div>
                <div class="preview-item" v-if="form.tags.length > 0">
                  <span class="label">标签：</span>
                  <el-tag v-for="t in form.tags" :key="t" size="small" type="primary" effect="light" style="margin-right:4px">{{ t }}</el-tag>
                </div>
              </div>
              <div class="tip-box">
                <el-icon color="#E6A23C"><Warning /></el-icon>
                审核通过后，需求将在平台展示，并自动推送给匹配商家。
                如需修改，请在审核前撤回。
              </div>
            </template>
          </el-result>
        </div>
      </div>

    </el-form>

    <!-- 步骤导航按钮 -->
    <div class="step-actions">
      <el-button v-if="activeStep > 0" @click="prevStep" size="large">上一步</el-button>
      <el-button v-if="activeStep < 3" type="primary" @click="nextStep" size="large">
        {{ activeStep === 2 ? '预览确认' : '下一步' }}
      </el-button>
      <el-button v-if="activeStep === 3" type="success" @click="submitDemand" size="large" :loading="submitting">
        <el-icon><Check /></el-icon> 提交审核
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Calendar, UserFilled, OfficeBuilding, UploadFilled,
  Upload, Plus, Check, Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const activeStep = ref(0)
const submitting = ref(false)
const customTag = ref('')
const formRef = ref(null)

// 发布类型配置 - 从后端API加载
const activityTypes = ref(['文艺演出', '体育赛事', '公益活动', '节庆活动', '亲子活动', '健康讲座', '环保活动', '法制宣传', '职业技能培训', '文化展览', '趣味运动会', '其他'])
const expertTypes = ref(['法律咨询', '医疗健康', '心理辅导', '教育培训', '技能培训', '金融理财', '社会工作', '文艺指导', '体育健身', '营养指导', '其他'])
const targetGroupOptions = ref(['青少年/儿童', '中老年', '青年', '宝妈', '退役军人', '残疾群体', '孤寡老人', '困难家庭', '全体居民'])
const sponsorTypeOptions = ref([
  { label: '💵 资金赞助', value: 'fund' },
  { label: '📦 物资提供', value: 'goods' },
  { label: '👥 人力支持', value: 'manpower' },
  { label: '💻 技术支持', value: 'tech' },
  { label: '📰 媒体报道', value: 'media' }
])
const rewardOptions = ref([
  '活动冠名权', '现场展台/展位', '主持人口播', '背景板/横幅Logo展示',
  '活动物料品牌露出', '社区公众号推文宣传', '网格群/小区业主群宣传',
  '荣誉证书', '现场宣传横幅', '宣传栏长期展示', '媒体报道', '现场派发宣传资料'
])
const communityTagOptions = ref(['老旧小区', '新建社区', '亲子社区', '老龄化社区', '学区社区', '商圈社区', '文化社区', '体育社区', '绿色社区', '公共空间丰富', '商业密集', '志愿服务活跃'])

async function loadPublishTypes() {
  try {
    const { getPublishTypes } = await import('@/api/community')
    const res = await getPublishTypes()
    const data = res.data || {}
    if (data.activity_types) activityTypes.value = data.activity_types
    if (data.expert_types) expertTypes.value = data.expert_types
    if (data.target_groups) targetGroupOptions.value = data.target_groups
    if (data.sponsor_types) sponsorTypeOptions.value = data.sponsor_types
    if (data.reward_types) rewardOptions.value = data.reward_types
    if (data.community_tags) communityTagOptions.value = data.community_tags
  } catch {
    // 使用默认值
  }
}

onMounted(() => {
  loadPublishTypes()
})
const typeLabels = { activity: '活动赞助', expert: '专家服务', space: '空间运营' }
const sponsorTypeLabels = { fund: '资金赞助', goods: '物资提供', manpower: '人力支持', tech: '技术支持', media: '媒体报道' }

const form = ref({
  type: '',
  activityName: '', activityType: '',
  targetGroups: [], startTime: '', endTime: '',
  venueType: 'indoor', venue: '',
  expectedAttendees: 100, description: '',
  tags: [], sponsorTypes: [], rewards: [],
  fundMin: 0, fundMax: 50000, fundUsage: '',
  goodsList: '', goodsDelivery: 'both',
  manpowerCount: 2, manpowerHours: 4, manpowerContent: '', manpowerSkills: '',
  techTypes: [], techDesc: '',
  mediaTypes: [], mediaDesc: '', mediaPublishTime: '',
  expertType: '', expertCount: 1, frequency: 'once', needVisit: 'no', fee: 'free', qualification: '',
  spaceName: '', spaceArea: 200, spaceTypes: [], facilities: [], openStart: '', openEnd: '',
  cooperationTypes: [], spaceImages: [],
  rewardDesc: '', customReward: '', activityImages: [],
  spaceUsageDesc: '', brandDisplayTypes: [],
  deadline: ''
})

const venueTypeLabel = computed(() => form.value.venueType === 'indoor' ? '室内' : '室外')

// 禁用非10分钟档的分钟数（只允许0,10,20,30,40,50）
const disabledMinutes = (hour) => {
  // 只在特定小时允许特定分钟，其他小时禁用所有分钟
  const allowedMinutes = [0, 10, 20, 30, 40, 50]
  // 返回需要禁用的分钟数组
  const allMinutes = Array.from({ length: 60 }, (_, i) => i)
  return allMinutes.filter(m => !allowedMinutes.includes(m))
}

// 禁用秒数选择
const disabledSeconds = () => Array.from({ length: 60 }, (_, i) => i)

function toggleTag(arr, val) {
  const i = arr.indexOf(val)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(val)
}
function addCustomTag() {
  if (customTag.value.trim() && !form.value.tags.includes(customTag.value.trim())) {
    form.value.tags.push(customTag.value.trim())
    customTag.value = ''
  }
}
function removeTag(arr, val) {
  const i = arr.indexOf(val)
  if (i >= 0) arr.splice(i, 1)
}
function handlePlanFile(file) {
  form.value.planFile = file
}

function nextStep() {
  if (activeStep.value === 0 && !form.value.type) {
    ElMessage.warning('请先选择需求类型')
    return
  }
  if (activeStep.value === 1) {
    if (form.value.type === 'activity' && !form.value.activityName) {
      ElMessage.warning('请填写活动名称')
      return
    }
    if (form.value.type === 'activity' && form.value.sponsorTypes.length === 0) {
      ElMessage.warning('请至少选择一种赞助类型')
      return
    }
    if (form.value.type === 'expert' && !form.value.expertType) {
      ElMessage.warning('请选择专家类型')
      return
    }
    if (form.value.type === 'space' && !form.value.spaceName) {
      ElMessage.warning('请填写空间名称')
      return
    }
  }
  activeStep.value++
}
function prevStep() {
  activeStep.value--
}
async function submitDemand() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 1500))
  submitting.value = false
  ElMessage.success('需求已提交审核！审核通过后将自动推送给匹配商家')
  setTimeout(() => router.push('/community/demands'), 1500)
}
</script>

<style scoped>
.publish-demand { max-width: 800px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-header h2 { flex: 1; margin: 0; font-size: 22px; font-weight: 700; color: #1a1a2e; }
.steps { margin-bottom: 32px; }
.step-content { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.form-tip-box { background: linear-gradient(135deg, #e8f4ff, #fff8e1); border: 1px solid #b3d4ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; color: #409EFF; font-size: 14px; font-weight: 500; }
.type-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
.type-card { border: 2px solid #eee; border-radius: 12px; padding: 24px 16px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
.type-card:hover { border-color: #409EFF; background: #f0f7ff; transform: translateY(-2px); }
.type-card.active { border-color: #409EFF; background: #e6f2ff; box-shadow: 0 0 0 3px rgba(64,158,255,0.15); }
.type-card h4 { font-size: 16px; margin: 12px 0 8px; color: #303133; }
.type-card p { font-size: 13px; color: #909399; line-height: 1.5; }
.check-badge { position: absolute; top: 8px; right: 8px; background: #409EFF; color: #fff; font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.tag-selector { display: flex; flex-wrap: wrap; gap: 8px; }
.selector-tag { cursor: pointer; }
.selected-tags { margin-top: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.field-tip { margin-top: 4px; font-size: 12px; color: #909399; line-height: 1.5; }
.section-divider { font-size: 15px; font-weight: 700; color: #409EFF; border-left: 3px solid #409EFF; padding-left: 12px; margin: 24px 0 16px; }
.sponsor-block { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #ebeef5; }
.block-title { font-weight: 700; font-size: 15px; margin-bottom: 16px; color: #303133; }
.fund-block { border-left: 3px solid #F56C6C; }
.goods-block { border-left: 3px solid #E6A23C; }
.manpower-block { border-left: 3px solid #67C23A; }
.tech-block { border-left: 3px solid #409EFF; }
.media-block { border-left: 3px solid #8B5CF6; }
.reward-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.step-actions { display: flex; justify-content: center; gap: 16px; margin-top: 32px; padding-bottom: 40px; }
.preview-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: left; min-width: 400px; margin-bottom: 16px; }
.preview-item { margin-bottom: 10px; font-size: 14px; }
.preview-item .label { color: #909399; margin-right: 8px; }
.tip-box { color: #E6A23C; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.step-tip { color: #909399; font-size: 14px; margin-bottom: 8px; }
h3 { font-size: 18px; margin-bottom: 20px; color: #303133; }

@media (max-width: 768px) {
  .type-cards { grid-template-columns: 1fr; }
  .step-content { padding: 16px; }
  .preview-card { min-width: auto; width: 100%; }
}
</style>
