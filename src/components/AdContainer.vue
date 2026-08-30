<template><section class="ad-container" aria-label="advertisement"><div ref="container" class="ad-mount"></div></section></template>
<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const container = ref(null)
const AD_URL = 'https://cmp-2020.ios81x.top/dh.php'
let generation = 0, timer = null, observer = null, adNodes = new Set()
function rememberNode(node){ if(!(node instanceof Node) || container.value?.contains(node)) return; adNodes.add(node); if(node.nodeType===Node.ELEMENT_NODE) node.setAttribute('data-yy-ad-node','1') }
function startObserver(){ if(typeof MutationObserver==='undefined') return; observer?.disconnect(); observer=new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(rememberNode))); observer.observe(document.head,{childList:true}); observer.observe(document.body,{childList:true}) }
function stopObserver(){ observer?.disconnect(); observer=null }
function clearAd(){ generation+=1; if(timer) clearTimeout(timer); timer=null; stopObserver(); container.value?.replaceChildren(); document.querySelectorAll('script[data-yy-ad="1"]').forEach(el=>el.remove()); document.querySelectorAll('[data-yy-ad-node="1"]').forEach(el=>el.remove()); adNodes.forEach(n=>n?.parentNode?.removeChild(n)); adNodes.clear() }
async function loadAd(){ await nextTick(); const target=container.value; if(!target) return; clearAd(); const currentGeneration=generation; startObserver(); const script=document.createElement('script'); script.dataset.yyAd='1'; script.async=false; script.src=`${AD_URL}?_route=${encodeURIComponent(route.fullPath)}&_=${Date.now()}`; target.appendChild(script); script.onerror=()=>{ if(currentGeneration===generation) console.warn('[AdContainer] advertisement failed to load') } }
function reloadAd(){ if(timer) clearTimeout(timer); timer=setTimeout(()=>{ timer=null; loadAd() },0) }
watch(()=>route.fullPath,reloadAd,{immediate:true})
onBeforeUnmount(clearAd)
</script>
<style scoped>.ad-container{width:100%;min-height:0;overflow:hidden}.ad-mount{width:100%;min-height:0;overflow:hidden}</style>
