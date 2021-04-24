<template>
  <div v-if="podcasts !== null">
    <h1>Podcasts</h1>

    <router-link
      :to="'/podcasts/' + podcast.slug"
      tag="div"
      class="podcast"
      v-for="podcast in podcasts"
      :key="podcast.slug"
    >
      <h2>{{ podcast.title }}</h2>
      <h3>{{ podcast.description }}</h3>
    </router-link>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ListView',
  
  data: () => ({
    podcasts: null,
  }),

  async created() {
    const podcasts = (await axios.get('/podcasts')).data
    podcasts.sort((a, b) => a.title.localeCompare(b.title))
    this.podcasts = podcasts
  },
}
</script>

<style scoped>
p {
  text-align: center;
}

.podcast {
	padding: 1em 2em;
	margin: 0.5em -2em 0;
}

.podcast:hover {
	background-color: rgba(166, 162, 220, 0.7);
	cursor: pointer;
}

@media only screen and (max-width: 768px)
{
	.podcast {
		margin-left: -1.5em;
		margin-right: -1.5em;
	}
}
</style>