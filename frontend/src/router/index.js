import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastListView from '../views/List.vue'
import PodcastSingleView from '../views/Single.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', component: PodcastListView },
  { path: '/:slug', component: PodcastSingleView },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
