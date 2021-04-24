import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastSingleView from '../views/PodcastSingle.vue'
import UploadNewEpisodeView from '../views/NewEpisode.vue'

Vue.use(VueRouter)

export const ROUTE_NAMES = {
  SINGLE: 'single',
  UPLOAD: 'upload'
}

const routes = [
  { path: '/', redirect: { name: ROUTE_NAMES.SINGLE,  params: { slug: 'a-demo-podcast' }}},
  { path: '/:slug', component: PodcastSingleView, name: ROUTE_NAMES.SINGLE },
  { path: '/:slug/new-episode', component: UploadNewEpisodeView, name: ROUTE_NAMES.UPLOAD },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
