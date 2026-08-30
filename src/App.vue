<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <header class="topbar">
      <button class="icon-btn menu-btn" aria-label="菜单" @click="toggleSidebar">☰</button>
      <router-link to="/" class="brand"><span class="brand-x">{{ site.name.charAt(0) }}</span>{{ site.name.slice(1) }}</router-link>
      <form class="search-wrap" @submit.prevent="search"><input v-model="keyword" autocomplete="off" placeholder="搜索视频、类别、标签..." /><button class="search-btn" aria-label="搜索">⌕</button></form>
      <div class="top-actions"><button class="action upload" type="button">上传</button><button class="action" type="button">中文⌄</button><button class="action muted" type="button">登录</button><button class="action register" type="button">注册</button></div>
    </header>

    <AdContainer />
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeMobileSidebar"></div>
    <div class="layout">
      <aside :class="['sidebar',{open:sidebarOpen}]">
        <nav class="sidebar-nav" aria-label="网站导航">
          <router-link v-for="item in primaryNav" :key="item.label" :to="item.to" class="nav-item" active-class="active" @click="closeMobileSidebar"><span class="nav-icon">{{item.icon}}</span><span class="nav-label">{{item.label}}</span></router-link>
          <router-link v-for="item in categories" :key="item.type_id" :to="`/category/${item.type_id}`" class="nav-item category-item" active-class="active" @click="closeMobileSidebar"><span class="nav-icon">🎥</span><span class="nav-label">{{item.type_name}}</span></router-link>
        </nav>
      </aside>
      <main class="content"><FriendlyLinks /><router-view /></main>
    </div>
  </div>
</template>
<script setup>
import { onBeforeUnmount, onMounted, nextTick, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import categories from './data/categories.json'
import site from './config/site.js'
import AdContainer from './components/AdContainer.vue'
import FriendlyLinks from './components/FriendlyLinks.vue'
const sidebarOpen=ref(false), sidebarCollapsed=ref(false), keyword=ref(''), router=useRouter(), route=useRoute()
const primaryNav=[{icon:'⌂',label:'首页',to:'/'},{icon:'◷',label:'最新',to:'/latest'},{icon:'♡',label:'最受欢迎',to:'/popular'}]
let lastTrackedUrl='', histatsReady=false, readyHandler=null, routeTimer=null
function isMobile(){return window.innerWidth<=900} function toggleSidebar(){if(isMobile()) sidebarOpen.value=!sidebarOpen.value; else sidebarCollapsed.value=!sidebarCollapsed.value} function closeMobileSidebar(){if(isMobile()) sidebarOpen.value=false} function search(){const q=keyword.value.trim();if(q)router.push({path:'/search',query:{wd:q}})} function onResize(){if(isMobile())sidebarCollapsed.value=false;else sidebarOpen.value=false} function currentUrl(){return window.location.pathname+window.location.search+window.location.hash}
function loadStatistics(){if(document.querySelector('script[data-site-tj="1"]'))return;const script=document.createElement('script');script.src='/tj.js';script.async=true;script.dataset.siteTj='1';document.head.appendChild(script)}
function trackPage(){const current=currentUrl();if(!histatsReady||current===lastTrackedUrl)return;lastTrackedUrl=current;window._Hasync=window._Hasync||[];window._Hasync.push(['Histats.track_hits',''])}
onMounted(()=>{window.addEventListener('resize',onResize);readyHandler=()=>{histatsReady=true;nextTick(trackPage)};window.addEventListener('histats-ready',readyHandler);loadStatistics()})
watch(()=>route.fullPath,async(newPath,oldPath)=>{if(newPath===oldPath)return;await nextTick();if(routeTimer)clearTimeout(routeTimer);routeTimer=setTimeout(()=>{trackPage();routeTimer=null},50)})
onBeforeUnmount(()=>{window.removeEventListener('resize',onResize);if(readyHandler)window.removeEventListener('histats-ready',readyHandler);if(routeTimer)clearTimeout(routeTimer)})
</script>
<style>
.sidebar{display:flex!important;flex-direction:column!important;overflow:hidden!important}.sidebar-nav{flex:1 1 auto;width:100%;min-height:0;height:auto!important;max-height:none;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#30373d transparent;padding-right:2px;padding-bottom:18px}.sidebar-nav::-webkit-scrollbar{width:6px}.sidebar-nav::-webkit-scrollbar-track{background:transparent}.sidebar-nav::-webkit-scrollbar-thumb{background:#30373d;border-radius:8px}.sidebar-nav::-webkit-scrollbar-thumb:hover{background:#454d54}.category-item .nav-icon{font-size:11px;opacity:.7}@media (min-width:901px){.app-shell.sidebar-collapsed .sidebar{width:0!important;min-width:0!important;flex-basis:0!important;padding:0!important;border-right:0!important;overflow:hidden!important}.app-shell.sidebar-collapsed .sidebar .nav-label{display:none!important}.app-shell.sidebar-collapsed .content{max-width:none}}@media (max-width:900px){.sidebar{height:100vh!important;max-height:100vh!important;overflow:hidden!important}.sidebar-nav{height:auto!important;max-height:none!important;padding-bottom:28px}}
</style>
