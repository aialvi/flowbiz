<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="app-header"><a href="/" class="brand">Flowbiz</a><span>Conversation workflow</span></header>
    <main><RouterView /></main>
  </div>
</template>
