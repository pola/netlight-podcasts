import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastListView from '../views/PodcastList.vue'
import PodcastSingleView from '../views/PodcastSingle.vue'
import AdministrationView from '../views/Administration'

Vue.use(VueRouter)

const routes = [
  { path: '/', component: PodcastListView },
  { path: '/:slug', component: PodcastSingleView },
  { path: '/admin', component: AdministrationView, name: 'admin' },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
