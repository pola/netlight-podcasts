<template>
  <div>
    <h1>Upload a new Episode</h1>
    <p>Episode is uploaded in podcast <em>{{ podcastTitle }}</em></p>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
    >
      <v-text-field
        v-model="name"
        :counter="10"
        label="Name"
        required
      />

      <v-btn
        :disabled="!valid"
        color="success"
        class="mr-4"
        @click="validate"
      >
        Submit
      </v-btn>
    </v-form>

    upload new
    {{ podcast }}
  </div>
</template>

<script>
import {getPodcast} from '@/utils/api'

export default {
  name: 'Administration',
  computed: {
    podcastTitle() {
      return this.podcast?.title
    },
    valid() {
      return this.name.length > 0
    }
  },
  data() {
    return {
      podcast: null,
      title: '',
      name: '',
    }
  },
  created() {
    this.loadPodcast()
  },
  methods: {
    async loadPodcast() {
    //TODO: hardcoded as we only have one podcast
      this.podcast = await getPodcast('a-demo-podcast')
    },

  }
}
</script>

<style land="scss" scoped>

</style>