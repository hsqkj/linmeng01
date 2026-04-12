<!--
  地图展示组件
  支持：展示坐标点、交互式拾取位置、静态地图兜底

  用法：
  <MapDisplay :lat="30.5728" :lng="114.2772" />
  <MapDisplay v-model:lat="form.lat" v-model:lng="form.lng" :editable="true" />
-->
<template>
  <div class="map-wrapper">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container" :style="{ height: height + 'px' }"></div>

    <!-- 无坐标时的提示 -->
    <div v-if="!hasCoords" class="map-empty">
      <div class="empty-icon">📍</div>
      <div class="empty-text">{{ emptyText }}</div>
      <el-button v-if="editable" type="primary" size="small" @click="enablePickMode">
        点击地图选择位置
      </el-button>
      <el-button v-if="editable && browserGeolocation" type="default" size="small" @click="getBrowserLocation">
        自动获取当前位置
      </el-button>
    </div>

    <!-- 坐标信息 -->
    <div v-if="hasCoords && !editable" class="coords-badge">
      <span>📍 {{ currentLat.toFixed(6) }}, {{ currentLng.toFixed(6) }}</span>
      <el-link type="primary" size="small" @click="openInBrowser">
        在腾讯地图打开
      </el-link>
    </div>

    <!-- 编辑模式下坐标输入 -->
    <div v-if="editable && hasCoords" class="coords-editor">
      <el-input-number v-model="currentLat" :precision="6" :step="0.001" size="small" controls-position="right" style="width:140px" />
      <span style="margin:0 4px;color:#909399">，</span>
      <el-input-number v-model="currentLng" :precision="6" :step="0.001" size="small" controls-position="right" style="width:140px" />
      <el-button size="small" @click="refreshMarker" style="margin-left:8px">定位</el-button>
      <el-button size="small" type="primary" @click="getBrowserLocation">当前位置</el-button>
    </div>

    <!-- 拾取模式提示 -->
    <div v-if="pickMode" class="pick-hint">
      <span>🖱️ 点击地图选择位置</span>
      <el-button size="small" @click="pickMode = false">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  editable: { type: Boolean, default: false },
  height: { type: Number, default: 280 },
  emptyText: { type: String, default: '暂无位置信息' }
})

const emit = defineEmits(['update:lat', 'update:lng', 'change'])

const mapContainer = ref(null)
const mapInstance = ref(null)
const markerInstance = ref(null)
const pickMode = ref(false)
const browserGeolocation = ref(false)
const currentLat = ref(props.lat)
const currentLng = ref(props.lng)

const hasCoords = computed(() =>
  currentLat.value !== null && currentLng.value !== null &&
  !isNaN(currentLat.value) && !isNaN(currentLng.value)
)

watch(() => props.lat, v => { currentLat.value = v; if (hasCoords.value) refreshMarker() })
watch(() => props.lng, v => { currentLng.value = v; if (hasCoords.value) refreshMarker() })

watch([currentLat, currentLng], () => {
  emit('update:lat', currentLat.value)
  emit('update:lng', currentLng.value)
  emit('change', { lat: currentLat.value, lng: currentLng.value })
})

function openInBrowser() {
  if (hasCoords.value) {
    window.open(`https://lbs.qq.com/getPoint/${currentLng.value},${currentLat.value}`)
  }
}

function getBrowserLocation() {
  if (!navigator.geolocation) {
    browserGeolocation.value = false
    return
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentLat.value = pos.coords.latitude
      currentLng.value = pos.coords.longitude
      if (mapInstance.value) {
        mapInstance.value.setCenter(new window.qq.maps.LatLng(currentLat.value, currentLng.value))
        placeMarker()
      }
    },
    err => { console.warn('Geolocation failed:', err) }
  )
}

function enablePickMode() {
  pickMode.value = true
  if (mapInstance.value) {
    mapInstance.value.setOptions({ draggableCursor: 'crosshair' })
  }
}

function placeMarker() {
  if (!mapInstance.value || !hasCoords.value) return
  if (markerInstance.value) {
    markerInstance.value.setMap(null)
  }
  const pos = new window.qq.maps.LatLng(currentLat.value, currentLng.value)
  markerInstance.value = new window.qq.maps.Marker({
    position: pos,
    map: mapInstance.value,
    animation: window.qq.maps.MarkerAnimation.DROP
  })
}

function refreshMarker() {
  nextTick(() => {
    if (mapInstance.value && hasCoords.value) {
      const pos = new window.qq.maps.LatLng(currentLat.value, currentLng.value)
      mapInstance.value.setCenter(pos)
      placeMarker()
    }
  })
}

function initMap() {
  if (!mapContainer.value) return

  // 等待腾讯地图 SDK 加载
  const tryInit = () => {
    if (typeof window.qq === 'undefined' || !window.qq.maps) {
      setTimeout(tryInit, 500)
      return
    }

    const center = hasCoords.value
      ? new window.qq.maps.LatLng(currentLat.value, currentLng.value)
      : new window.qq.maps.LatLng(30.5928, 114.3055) // 武汉默认

    const map = new window.qq.maps.Map(mapContainer.value, {
      center,
      zoom: hasCoords.value ? 15 : 11,
      mapStyleId: 'style1'
    })
    mapInstance.value = map

    if (hasCoords.value) placeMarker()

    // 点击拾取
    window.qq.maps.event.addListener(map, 'click', e => {
      if (!props.editable) return
      currentLat.value = e.latLng.getLat()
      currentLng.value = e.latLng.getLng()
      pickMode.value = false
      map.setOptions({ draggableCursor: '' })
      placeMarker()
    })
  }

  tryInit()
}

onMounted(() => {
  nextTick(() => initMap())
})

onUnmounted(() => {
  if (markerInstance.value) markerInstance.value.setMap(null)
})
</script>

<style scoped>
.map-wrapper { position: relative; }
.map-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}
.map-empty {
  position: absolute;
  inset: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  z-index: 10;
}
.empty-icon { font-size: 32px; }
.empty-text { color: #909399; font-size: 13px; }
.coords-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.92);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  z-index: 10;
}
.coords-editor {
  display: flex;
  align-items: center;
  margin-top: 8px;
  flex-wrap: wrap;
  gap: 4px;
}
.pick-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: #409EFF;
  color: #fff;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(64,158,255,0.4);
}
</style>
