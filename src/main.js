import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import site from './config/site.js'
import './styles.css'
import './xtv-pages.css'
import './video-grid.css'
import './styles-play.css'
import 'plyr/dist/plyr.css'
const Home=()=>import('./views/Home.vue'), Category=()=>import('./views/Category.vue'), Search=()=>import('./views/Search.vue'), Play=()=>import('./views/Play.vue'), History=()=>import('./views/History.vue'), NotFound=()=>import('./views/NotFound.vue')
document.title=site.title;const description=document.querySelector('meta[name="description"]');if(description)description.setAttribute('content',site.description)
const router=createRouter({history:createWebHistory(),routes:[{path:'/',component:Home},{path:'/categories',component:Category},{path:'/category/:id',component:Category},{path:'/search',component:Search},{path:'/play/:id',component:Play},{path:'/history',component:History},{path:'/latest',component:Category,props:{latest:true}},{path:'/popular',component:Category,props:{popular:true}},{path:'/trending',component:Category,props:{popular:true}},{path:'/detail/:id',redirect:to=>`/play/${to.params.id}`},{path:'/:pathMatch(.*)*',component:NotFound}],scrollBehavior:()=>({top:0})})
createApp(App).use(router).mount('#app')
