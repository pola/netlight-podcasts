<template>
  <div>
    upload new
    {{podcasts}}

  </div>
</template>

<script>
import {getPodcasts} from '@/utils/api'

export default {
  name: 'Administration',
  data() {
    return {
      podcasts: null
    }
  },
  created() {
    this.loadPodcasts()
  },
  methods: {
    async loadPodcasts() {
      this.podcasts = await getPodcasts()
    },

  }
}
</script>

<style land="scss" scoped>

</style>