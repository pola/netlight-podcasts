<template>
  <div class="nav-bar">
    <div />
    <div class="nav-bar__right">
      <template v-if="isSignedIn">
        <router-link
          v-for="item in adminItems"
          :key="item.title"
          :to="{name: item.route, params: { slug: 'a-demo-podcast' }}"
          tag="div"
        >
          <NavBarItem
            v-if="user.isAdmin"
            :title="item.title"
          />
        </router-link>
        <NavBarItem
          title="Sign out"
          @click="signOut"
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
    goToUpload() {
      this.$router.push({name: ROUTE_NAMES.UPLOAD, params: { slug: 'a-demo-podcast' }})
    },
    goToEpisodes() {
      this.$router.push({name: ROUTE_NAMES.SINGLE, params: { slug: 'a-demo-podcast' }})
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
  &__right {
    display: flex;
  }
}

@media only screen and (max-width: 768px)
{
  body {
    font-size: 0.75em;
  }

  .content {
    padding: 1em;
  }

  .userBar {
    left: 0;
    text-align: center;
  }
}
</style>