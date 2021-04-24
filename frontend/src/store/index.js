import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
  },
  getters: {
    isAdmin() {
      return this.user?.isAdmin()
    }
  },
  mutations: {
    setUser(store, user) {
      store.user = user
    },
  },
})
