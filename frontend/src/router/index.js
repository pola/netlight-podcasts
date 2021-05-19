import Vue from 'vue'
import VueRouter from 'vue-router'
import PodcastSingleView from '../views/PodcastSingle.vue'
import UploadNewEpisodeView from '../views/NewEpisode.vue'
import GuideView from '../views/Guide.vue'
import AboutView from '../views/About.vue'

Vue.use(VueRouter)

export const ROUTE_NAMES = {
  SINGLE: 'single',
  UPLOAD: 'upload',
  GUIDE: 'guide',
  ABOUT: 'about'
}

const routes = [
  { path: '/', redirect: { name: ROUTE_NAMES.SINGLE,  params: { slug: 'netlight-stories' }}},
  { path: '/guide', component: GuideView, name: ROUTE_NAMES.GUIDE },
  { path: '/about-netlight-stories', component: AboutView, name: ROUTE_NAMES.ABOUT },
  { path: '/:slug', component: PodcastSingleView, name: ROUTE_NAMES.SINGLE },
  { path: '/:slug/new-episode', component: UploadNewEpisodeView, name: ROUTE_NAMES.UPLOAD },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
