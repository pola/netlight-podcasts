<template>
  <div>
    <template v-if="streams !== null">
      <p v-if="streams.length === 0">
        There are currently no planned upcoming live streams.
      </p>

      <router-link
        :to="'/' + stream.slug"
        tag="div"
        class="stream"
        v-for="stream in streams"
        :key="stream.slug"
      >
        <h2>{{ stream.title }}</h2>
        <h3>{{ stream.start | moment('llll') }}</h3>
      </router-link>
    </template>

    <template v-else-if="error">
      <p>
        This list of live streams could not be loaded. Please try again.
      </p>
    </template>

    <p class="contact">
      <a
        href="https://netlight.slack.com/archives/DJSTMGW1G"
        target="_blank"
      >
        Contact
      </a>
    </p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ListView',
  
  data: () => ({
    streams: null,
    error: false,
  }),

  async created() {
    try {
      const streams = (await axios.get('/streams')).data
      streams.sort((a, b) => a.start - b.start)
      this.streams = streams
    } catch {
      this.error = true
    }
  },
}
</script>

<style scoped>
p {
  text-align: center;
}

.stream {
	padding: 1em 2em;
	margin: 0.5em -2em 0;
}

.stream:hover {
	background-color: rgba(166, 162, 220, 0.7);
	cursor: pointer;
}

@media only screen and (max-width: 768px)
{
	.stream {
		margin-left: -1.5em;
		margin-right: -1.5em;
	}
}
</style>