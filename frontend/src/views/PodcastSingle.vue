<template>
  <div
    v-if="!isLoggedIn"
    class="podcast__sign-in"
  >
    <p style="text-align: center;">
      To see this content, please
      <a
        :href="'/login?target=' + encodeURIComponent($router.currentRoute.path)"
      >sign in</a>
      with your Netlight account.
    </p>
  </div>

  <div v-else-if="podcast !== null">
    <h2>Tune in</h2>
    <p>
      Use the link below to tune in to the podcast in your favourite
      application.
    </p>

    <input
      id="link-input"
      class="podcast__link"
      type="text"
      :value="'https://podcasts.netlight.com/rss/' + podcast.token + '.xml'"
      @focus="(e) => e.target.select()"
      readonly
    />
    <v-btn
      @click="copyToClipboard"
      small
    >
      Copy link
    </v-btn>

    <div>
      <p>
        Note that the link is <strong>personal</strong> and
        <strong>should be kept secret</strong>.
      </p>
      <v-btn
        @click="confirmTokenRefreshDialog = true"
        small
      >
        Generate new link
      </v-btn>
    </div>

    <h2>Episodes</h2>
    <div
      class="episode"
      :key="episode.slug"
      v-for="episode in podcast.episodes"
    >
      <img
        class="episode__img"
        :src="require(getEpisodeImgAsset(episode))"
      />
      <div>
        <div class="header">
          <h3>{{ episode.title }}</h3>
          <div class="meta">
            {{ episode.published | moment("ll") }} •
            {{ Math.floor(episode.duration / 60) }} min
          </div>
        </div>

        <p>{{ episode.description }}</p>

        <audio controls>
          <source
            :src="'/audio/' + podcast.token + '/' + episode.slug"
            :type="episode.fileMimeType"
          />
        </audio>
      </div>
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
          When you generate a new link, your current link will stop working.
          Confirm that this is what you want to do.
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
import { getPodcast } from '@/utils/api'

export default {
  name: 'ListView',
  computed: {
    isLoggedIn() {
      return this.$store.state.user !== null
    }
  },

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
        const podcast = (
          await axios.patch('/podcasts/' + this.podcast.slug, {
            token: null,
          })
        ).data

        this.podcast.token = podcast.token
        this.confirmTokenRefreshDialog = false
        this.refreshedSnackbar = true
      } catch {
        alert('Failed to refresh link.')
      }

      this.isRefreshingToken = false
    },
    copyToClipboard() {
      /* Get the text field */
      var copyText = document.getElementById('link-input')

      /* Select the text field */
      copyText.select()
      copyText.setSelectionRange(0, 99999) /* For mobile devices */

      /* Copy the text inside the text field */
      document.execCommand('copy')
    },
    getEpisodeImgAsset(episode) {
      // TODO: This should be refactored and have links to the img in the database :D
      const titleAssets = [
        { title: 'Sofia', asset: '@/assets/profile-sofia.png' },
        { title: 'Christian', asset: '@/assets/profile-johanna-christian.png' },
        { title: 'Johan went', asset: '@/assets/profile-johan.png' },
        { title: 'Anna', asset: '@/assets/profile-anna.png' },
        { title: 'Lena', asset: '@/assets/profile-lena.png' },
        { title: 'Cagla', asset: '@/assets/profile-cagla.png' },
        { title: 'Kim', asset: '@/assets/profile-kim.png' },
        { title: 'Ivan', asset: '@/assets/profile-ivan.png' },
        { title: 'Viktor', asset: '@/assets/profile-viktor.png' },
        { title: 'Ulrika', asset: '@/assets/profile-ulrika.png' },
        { title: 'Witt', asset: '@/assets/profile-witt-hanna.png' },
      ]

      const titleAsset = titleAssets.find(({ title }) =>
        episode.title.includes(title)
      )
      return titleAsset?.asset || '@/assets/stories.pngj'
    },
  },

  async created() {
    if (this.isLoggedIn) {
      this.podcast = await getPodcast(this.$route.params.slug)
      this.podcast.episodes.sort((a, b) => b.published - a.published)
    }
  },
}
</script>

<style lang="scss" scoped>
p {
  margin: 10px;
}

.podcast__sign-in {
  margin-top: 3em;
  height: 100px;
}
.podcast__link {
  color: #563a92;
  text-align: center;
}

.episode {
  background: rgba(255, 255, 255, 0.4);
  padding: 15px;
  display: flex;
  align-items: center;
  text-align: left;

  &__img {
    height: 180px;
    margin-right: 10px;
  }
}

.episode p {
  text-align: left;
}

.episode p {
  margin: 0;
}

.episode .header {
  display: flex;
  align-items: baseline;
  padding-bottom: 10px;
}

.episode .header h3 {
  text-align: left;
}

.episode .header .meta {
  color: #666666;
  text-transform: uppercase;
  font-size: 0.9em;
  margin-left: 15px;
}

.episode audio {
  margin-top: 10px;
}

@media only screen and (max-width: 768px) {
  .episode {
    flex-direction: column;

    &__img {
      margin-right: 0;
      margin-bottom: 10px;
      height: 180px;
      width: 180px;
    }
  }

  .episode audio {
    width: 100%;
  }
}
</style>
