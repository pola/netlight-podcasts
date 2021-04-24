<template>
  <div class="nav-bar">
    <div />
    <div class="nav-bar__right">
      <template v-if="isSignedIn">
        <NavBarItem
          v-if="user.isAdmin"
          title="Upload Episode"
          @click="goToUpload"
        />
        <NavBarItem
          v-if="user.isAdmin"
          title="Episodes"
          @click="goToEpisodes"
        />
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