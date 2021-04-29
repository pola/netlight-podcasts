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
  color: #7473bd;
  font-weight: bold;
  padding: 0.5em;
  cursor: pointer;
  margin-bottom: 0;
  &:hover {
    opacity: 0.7
  }
}

</style>