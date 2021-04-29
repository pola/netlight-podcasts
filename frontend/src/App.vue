<template>
  <v-app>
    <NavBar />
    <div class="wrapper">
      <div class="content">
        <router-link
          tag="img"
          to="/"
          :src="require('@/assets/logo-netlight-stories--dark.png')"
          alt="Netlight Stories"
          class="logo"
        />
        <router-view />
      </div>
    </div>
  </v-app>
</template>

<script>
import NavBar from '@/components/NavBar'

export default {
  components: {NavBar},
  methods: {
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: rgba(249, 249, 249, 0.9);
}

.logo {
  width: min(80%, 1024px);
  display: block;
  margin: auto
}

.content {
  margin: 0 auto;
  font-family: 'proxima_novaregular';
	padding: 2em;
  width: min(100%, 780px);
  text-align: center;
}


@media only screen and (max-width: 768px)
{
	body {
		font-size: 0.75em;
  }
  
  .content {
    padding: 1em;
  }
}
</style>