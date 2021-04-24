<template>
  <div v-if="$store.state.user === null">
    <h1>Sign in</h1>
    <p style="text-align: center;">
      To see this content, please <a :href="'/login?target=' + encodeURIComponent($router.currentRoute.path)">sign in</a> with your Netlight account.
    </p>
  </div>
  
  <div v-else-if="podcast !== null">
    <h1>{{ podcast.title }}</h1>
    <p>{{ podcast.description }}</p>

    <h2>Tune in</h2>
    <p>Use the link below to tune in to the podcast in your favourite application.</p>

    <input
      type="text"
      :value="'https://podcasts.netlight.com/rss/' + podcast.token + '.xml'"
      @focus="e => e.target.select()"
      readonly
    />
      
    <p>
      Note that the link is <strong>personal</strong> and <strong>should be kept secret</strong>.
      <v-btn
        @click="confirmTokenRefreshDialog = true"
        small
      >
        Generate new link
      </v-btn>
    </p>

    <h2>Serials</h2>
    <div
      class="episode"
      :key="episode.slug"
      v-for="episode in podcast.episodes"
    >
      <div class="header">
        <h3>{{ episode.title }}</h3>
        <div class="meta">
          {{ episode.published | moment('ll') }} • {{ Math.floor(episode.duration / 60) }} min
        </div>
      </div>

      <p>{{ episode.description }}</p>
    </div>

    <v-dialog
      v-model="confirmTokenRefreshDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title>
          Generate new link
        </v-card-title>

        <v-card-text>
          When you generate a new link, your current link will stop working. Confirm that this is what you want to do.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="confirmTokenRefreshDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="refreshToken()"
            :disabled="isRefreshingToken"
          >
            Generate new link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="refreshedSnackbar"
      color="success"
      :timeout="2000"
    >
      Your link has been renewed.
    </v-snackbar>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ListView',
  
  data: () => ({
    podcast: null,
    confirmTokenRefreshDialog: false,
    refreshedSnackbar: false,
    isRefreshingToken: false,
  }),

  methods: {
    async refreshToken() {
      this.isRefreshingToken = true

      try {
        const podcast = (await axios.patch('/podcasts/' + this.podcast.slug, {
          token: null,
        })).data

        this.podcast.token = podcast.token
        this.confirmTokenRefreshDialog = false
        this.refreshedSnackbar = true
      } catch {
        alert('Failed to refresh link.')
      }

      this.isRefreshingToken = false
    }
  },

  async created() {
    this.podcast = (await axios.get('/podcasts/' + this.$route.params.slug)).data
    this.podcast.episodes.sort((a, b) => a.published - b.published)
  },
}
</script>

<style scoped>
h2, h3 {
  text-align: left;
}

p {
  margin-top: 0;
}

input {
  margin: 10px 0;
}

h2 {
  margin-top: 30px;
}

.episode {
  background: rgba(255, 255, 255, 0.4);
  padding: 15px;
}

.episode p {
  text-align: left;
}

.episode p {
  margin-bottom: 0;
}

.episode .header {
  display: flex;
  align-items: baseline;
  padding-bottom: 10px;
}

.episode .header .meta {
  color: #666666;
  text-transform: uppercase;
  font-size: 0.9em;
  margin-left: 15px;
}
</style>