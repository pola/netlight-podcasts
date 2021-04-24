<template>
  <div v-if="podcast">
    <h1>Upload a new Episode</h1>
    <p>Episode is uploaded in podcast <em>{{ podcastTitle }}</em></p>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
    >
      <v-text-field
        v-model="title"
        error-messages="Title is required"
        label="title"
        :rules="titleRules"
        required
      />

      <v-btn
        :disabled="!valid"
        class="mr-4"
        @click="submit"
      >
        submit
      </v-btn>

      <v-btn
        color="warning"
        @click="resetValidation"
      >
        Reset Validation
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
      valid: true,
      title: '',
      titleRules: [
        v => !!v || 'Name is required',
        v => (v && v.length <= 10) || 'Name must be less than 10 characters',
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
      postNewEpisode(this.title)
    },
    validate () {
      this.$refs.form.validate()
    },
    reset () {
      this.$refs.form.reset()
    },
    resetValidation () {
      this.$refs.form.resetValidation()
    },

  }
}
</script>

<style land="scss" scoped>

</style>