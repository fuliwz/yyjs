<script setup>
import { ref, onMounted } from 'vue'
import { getVideos } from '../api/vod'
const videos=ref([]); const loading=ref(true); const error=ref('')
onMounted(async()=>{try{videos.value=(await getVideos({page:1,limit:20})).list}catch(e){error.value=e.message||'加载失败'}finally{loading.value=false}})
</script>
<template><section><h1>首页</h1><p v-if="loading">加载中...</p><p v-else-if="error">{{error}}</p><div v-else class="video-grid"><article v-for="v in videos" :key="v.id"><router-link :to="`/play/${v.id}`"><img :src="v.poster" :alt="v.title" loading="lazy"><h3>{{v.title}}</h3></router-link></article></div></section></template>
