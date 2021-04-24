import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastSingleView from '../views/PodcastSingle.vue'
import AdministrationView from '../views/Administration'

Vue.use(VueRouter)

export const ROUTE_NAMES = {
  SINGLE: 'single',
  ADMIN: 'admin'
}

const routes = [
  { path: '/', redirect: { name: ROUTE_NAMES.SINGLE,  params: { slug: 'a-demo-podcast' }}},
  { path: '/:slug', component: PodcastSingleView, name: ROUTE_NAMES.SINGLE },
  { path: '/admin', component: AdministrationView, name: ROUTE_NAMES.ADMIN },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
