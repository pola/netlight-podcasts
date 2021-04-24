<template>
  <div>
    <NavBar />
    <div class="wrapper">
      <router-link
        tag="img"
        to="/"
        src="/images/logo.svg"
        alt="Netlight Podcasts"
        class="logo"
      />
      <router-view class="content" />
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar'

export default {
  components: {NavBar},
  methods: {
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
  padding: 2em;
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