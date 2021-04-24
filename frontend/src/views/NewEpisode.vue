<template>
  <div v-if="podcast">
    <h1>Add a new episode</h1>
    <p>The episode is added to podcast <em>{{ podcastTitle }}</em></p>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
    >
      <v-text-field
        v-model="title"
        label="Title"
        :rules="titleRules"
      />

      <v-btn
        :disabled="!valid"
        class="mr-4"
        @click="submit"
      >
        submit
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import { getPodcast, postNewEpisode} from '@/utils/api'
import {ROUTE_NAMES} from '@/router'

export default {
  name: 'Administration',
  beforeEnter: (to, from, next) => {
    if (this.$store.getters.isAdmin) {
      next()
    } else {
      next({ name: ROUTE_NAMES.SINGLE, params: to.params })
    }
  },
  computed: {
    podcastTitle() {
      return this.podcast?.title
    }
  },
  data() {
    return {
      podcast: null,
      valid: false,
      name: '',
      title: '',
      titleRules: [
        v => !!v || 'Title is required',
        v => (v && v.length <= 100) || 'Title must be less than 100 characters',
      ],
    }
  },
  created() {
    this.loadPodcast()
  },
  methods: {
    async loadPodcast() {
    //TODO: hardcoded as we only have one podcast
      this.podcast = await getPodcast(this.$route.params.slug, true)
    },
    submit() {
      this.$refs.form.validate()
      if (this.valid)
        postNewEpisode(this.title)
    },

  }
}
</script>

<style land="scss" scoped>

</style>