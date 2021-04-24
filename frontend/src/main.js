import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'

Vue.config.productionTip = false

const moment = require('moment')
 
Vue.use(require('vue-moment'), {
  moment,
})

axios.defaults.withCredentials = true
axios.defaults.baseURL = '/api'

const x = async () => {
  store.commit('setUser', (await axios.get('/me')).data)

  new Vue({
    router,
    store,
    render: h => h(App),
  }).$mount('#app')
}

x()
