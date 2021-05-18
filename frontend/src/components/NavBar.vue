<template>
  <div class="nav-bar">
    <div v-if="isSignedIn">
      <router-link
        tag="img"
        to="/"
        :src="require('@/assets/netlight-stories--dark.png')"
        alt="Netlight Stories"
        class="nav-bar__home"
      />
    </div>
    <div class="nav-bar__right">
      <template v-if="isSignedIn">
        <router-link
          v-for="item in adminItems"
          :key="item.title"
          :to="{name: item.route, params: { slug: 'netlight-stories' }}"
          tag="div"
        >
          <NavBarItem
            v-if="user.isAdmin"
            :title="item.title"
          />
        </router-link>
        <NavBarItem
          title="Guide"
          @click="guide"
        />
        <NavBarItem
          title="Sign out"
          @click="signOut"
        />
        <NavBarItem
          title="About Netlight Stories"
          @click="about"
        />
      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NavBarItem from '@/components/NavBarItem'
import { ROUTE_NAMES } from '@/router'

export default {
name: 'NavBar',
  components: {NavBarItem},
  computed: {
    user () {
      return this.$store.state.user
    },
    isSignedIn() {
      return  this.user !== null
    }
  },
  data() {
    return {
      uploadRoute: ROUTE_NAMES.UPLOAD,
      episodesRoute: ROUTE_NAMES.SINGLE,
      adminItems: [{
        title: 'Add Episode',
        route: ROUTE_NAMES.UPLOAD
      },{
        title: 'Episodes',
        route: ROUTE_NAMES.SINGLE
      }]
    }
  },
  methods: {
    async signOut() {
      await axios.delete('/me')
      this.$store.commit('setUser', null)
    },
    async guide() {
        this.$router.push({name: ROUTE_NAMES.GUIDE})
    },
    async about() {
        this.$router.push({name: ROUTE_NAMES.ABOUT})

},
    goToUpload() {
      this.$router.push({name: ROUTE_NAMES.UPLOAD, params: { slug: 'netlight-stories' }})
    },
    goToEpisodes() {
      this.$router.push({name: ROUTE_NAMES.SINGLE, params: { slug: 'netlight-stories' }})
    }

  }
}
</script>

<style lang="scss" scoped>


.nav-bar {
  display: flex;
  align-self: stretch;
  justify-content: space-between;
  padding: 1em;
  color: white;
  text-decoration: none;
  align-items: center;
  position: fixed;
  top: 0;
  width: 100%;
  &__right {
    display: flex;
  }
  &__home {
    color: #7473bd;
    text-decoration: none;
    font-size: 1.2em;
    font-weight: bold;
    width: 100px;
    cursor: pointer;
    &:hover {
      opacity: 0.7;

    }
  }
}

@media only screen and (max-width: 768px)
{
}
</style>