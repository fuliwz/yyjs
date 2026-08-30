<template>
  <section class="home">
    <section class="section popular-section">
      <div class="section-head"><h2>流行于</h2><router-link class="see-all" to="/popular">查看全部</router-link></div>
      <div class="video-grid popular-grid">
        <article v-for="item in popular" :key="item.id" class="video-card" @click="open(item.id)"><div class="thumb"><img :src="item.poster || fallback" :alt="item.title" loading="lazy" @error="fallbackImage"><span class="badge">{{ item.updateTime || item.raw?.vod_time || '' }}</span><span class="duration">{{ item.duration || 'HD' }}</span><button class="play" aria-label="播放">▶</button></div><h3>{{item.title}}</h3><div class="stats"><span>◉ {{formatViews(item.views)}}</span><span class="score">★ {{item.score || '—'}}</span></div></article>
      </div>
    </section>
    <section class="section"><div class="section-head tabs-head"><h2>新的视频</h2><div class="tabs"><button v-for="tab in tabs" :key="tab.key" :class="{selected:activeTab===tab.key}" @click="changeTab(tab.key)">{{tab.label}}</button></div><router-link class="see-all" to="/latest">查看全部</router-link></div>
      <div v-if="loading" class="video-grid"><div v-for="n in 20" :key="n" class="video-card skeleton-card"><div class="thumb skeleton"></div><div class="line skeleton"></div><div class="line short skeleton"></div></div></div>
      <div v-else-if="videos.length" class="video-grid"><article v-for="item in videos" :key="item.id" class="video-card" @click="open(item.id)"><div class="thumb"><img :src="item.poster || fallback" :alt="item.title" loading="lazy" @error="fallbackImage"><span class="badge">{{ item.updateTime || item.raw?.vod_time || '' }}</span><span class="duration">{{item.duration || 'HD'}}</span><button class="play" aria-label="播放">▶</button></div><h3>{{item.title}}</h3><div class="stats"><span>◉ {{formatViews(item.views)}}</span><span class="score">★ {{item.score || '—'}}</span></div></article></div>
      <div v-else class="empty">暂无内容</div>
    </section>
    <section class="section category-home"><div class="section-head"><h2>类别</h2><router-link class="see-all" to="/categories">查看全部</router-link></div><div class="category-grid"><router-link v-for="cat in classes.slice(0,8)" :key="cat.type_id" class="category" :to="`/category/${cat.type_id}`"><span>▦</span><div><strong>{{cat.type_name}}</strong><small>浏览内容</small></div></router-link></div></section>
    <section class="section"><div class="section-head"><h2>热门标签</h2><span class="see-all">点击搜索</span></div><div class="tags"><router-link v-for="tag in tags" :key="tag.name" class="tag" :to="`/search?wd=${encodeURIComponent(tag.keyword)}`">{{tag.name}}</router-link></div></section>
    <footer class="footer"><div>关于我们　条款　隐私　帮助　联系我们</div><div>{{site.copyright}}</div></footer>
  </section>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { getLatestVideos, getHotVideos } from '../api/vod'
import { useRouter } from 'vue-router'
import categoriesData from '../data/categories.json'
import tags from '../data/hot-tags.json'
import site from '../config/site.js'
const router=useRouter(); const tabs=[{key:'latest',label:'最新'},{key:'hot',label:'热门'},{key:'popular',label:'最受欢迎'},{key:'long',label:'长的'},{key:'comments',label:'评论的'},{key:'tags',label:'在标签'}]; const activeTab=ref('latest'); const videos=ref([]); const popular=ref([]); const classes=ref(Array.isArray(categoriesData)?categoriesData:[]); const loading=ref(true); const fallback='/fallback.svg'
function fallbackImage(e){e.target.src=fallback} function open(id){if(id)router.push(`/play/${id}`)} function formatViews(v){const n=Number(v)||0;return n>999999?`${(n/1000000).toFixed(1)}M`:n>999?`${(n/1000).toFixed(1)}K`:String(n)}
async function load(){loading.value=true;try{const [main,hot]=await Promise.all([activeTab.value==='latest'?getLatestVideos(1,20):getHotVideos(1,20),getHotVideos(1,20)]);videos.value=main.list;popular.value=hot.list}catch{videos.value=[];popular.value=[]}finally{loading.value=false}}
async function changeTab(key){activeTab.value=key;await load()} onMounted(load)
</script>
