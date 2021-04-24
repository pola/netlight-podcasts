<template>
  <p class="nav-bar-item" @click="$emit('click')">{{ title }}</p>
</template>

<script>
export default {
  name: 'NavBarItem',
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.nav-bar-item {
  color: white;
  font-weight: bold;
  padding: 0.5em;
  cursor: pointer;
  &:hover {
    opacity: 0.7
  }
}

</style>