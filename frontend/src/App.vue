<template>
  <div class="wrapper">
    <div class="userBar">
      <template v-if="$store.state.user === null">
        <a :href="'/login?target=' + encodeURIComponent($router.currentRoute.path)">Sign in</a>
      </template>
      <template v-else>
        Hello {{ $store.state.user.name }} | <a @click="signOut">Sign out</a>
      </template>
    </div>

    <router-link
      tag="img"
      to="/"
      src="/images/logo.svg"
      alt="Netlight Live"
      class="logo"
    />

    <router-view class="content" />
  </div>
</template>

<script>
import axios from 'axios'

export default {
  methods: {
    async signOut() {
      await axios.delete('/me')
      this.$store.commit('setUser', null)
    },
  }
}
</script>

<style scoped>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.logo, .content {
  width: 100%;
}

.logo {
  cursor: pointer;
  display: block;
  width: min(80%, 500px);
  filter: drop-shadow(0 0 1px #666666);
}

.content {
  margin-top: 2em;
  margin-bottom: 20vh;
  width: min(80%, 800px);
  font-family: 'proxima_novaregular';
  background-color: rgba(249, 249, 249, 0.7);
	padding: 2em;
  box-shadow: 0 0 30px rgba(166, 162, 220, 0.7);
}

.userBar {
  position: fixed;
  top: 0;
  right: 0;
  background: rgba(249, 249, 249, 0.7);
  box-shadow: 0 0 30px rgba(166, 162, 220, 0.7);
  padding: 10px;
}

.userBar, .userBar > a {
  color: #2C3F6B;
  text-decoration: none;
}

.userBar > a:hover {
  cursor: pointer;
  text-decoration: underline;
}

@media only screen and (max-width: 768px)
{
	body {
		font-size: 0.75em;
  }
  
  .content {
    padding: 1em;
  }
		
	#interaction > input {
		text-align: left;
	}

	.stream {
		margin-left: -1.5em;
		margin-right: -1.5em;
	}

  .userBar {
    left: 0;
    text-align: center;
  }
}
</style>