<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getClasses, getCategoryVideos, getLatestVideos, getHotVideos } from '../api/vod'
const route=useRoute(); const videos=ref([]); const classes=ref([]); const loading=ref(true); const error=ref('')
onMounted(async()=>{try{classes.value=await getClasses(); const p=Number(route.params.id)||undefined; const r=route.path==='/latest'?await getLatestVideos():route.path==='/popular'||route.path==='/trending'?await getHotVideos():await getCategoryVideos(p); videos.value=r.list}catch(e){error.value=e.message||'加载失败'}finally{loading.value=false}})
</script>
<template><section><h1>{{route.path==='/latest'?'最新':route.path==='/popular'||route.path==='/trending'?'热门':'分类'}}</h1><p v-if="loading">加载中...</p><p v-else-if="error">{{error}}</p><div v-else class="video-grid"><article v-for="v in videos" :key="v.id"><router-link :to="`/play/${v.id}`"><img :src="v.poster" :alt="v.title" loading="lazy"><h3>{{v.title}}</h3></router-link></article></div></section></template>
