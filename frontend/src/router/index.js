import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastSingleView from '../views/PodcastSingle.vue'
import AdministrationView from '../views/Administration'

Vue.use(VueRouter)

const ROUTENAMES = {
  SINGLE: 'single',
  ADMIN: 'admin'
}

const routes = [
  { path: '/', redirect: { name: ROUTENAMES.SINGLE,  params: { slug: 'a-demo-podcast' }}},
  { path: '/:slug', component: PodcastSingleView, name: ROUTENAMES.SINGLE },
  { path: '/admin', component: AdministrationView, name: ROUTENAMES.ADMIN },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
