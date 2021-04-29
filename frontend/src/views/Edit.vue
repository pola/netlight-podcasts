<template>
  <div class='edit'>
    upload new
    {{episode}}
    <v-textarea
      outlined
      name="episode_title"
      label="Episode title"
      value="The Woodman set to work at once, and so sharp was his axe that the tree was soon chopped nearly through."
  ></v-textarea>
  <v-btn block>
    Update
  </v-btn>
  </div>
</template>

<script>
import {getEpisode} from '@/utils/api'

export default {
  name: 'Edit',
  data() {
    return {
      episode: null
    }
  },
  created() {
    this.loadEpisode()
  },
  methods: {
    async loadEpisode() {
      this.episode = await getEpisode('38L6MSAT')
    },

  }
}
</script>

<style land="scss" scoped>
.edit {
 background-color: lightblue;
}
   
</style>