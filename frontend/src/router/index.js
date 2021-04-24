import Vue from 'vue'
import VueRouter from 'vue-router'
import ListView from '../views/List.vue'
import StreamView from '../views/Stream.vue'
import PodcastListView from '../views/podcast/List.vue'
import PodcastSingleView from '../views/podcast/Single.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', component: ListView },
  { path: '/podcasts', component: PodcastListView },
  { path: '/podcasts/:slug', component: PodcastSingleView },
  { path: '/:slug', component: StreamView },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
