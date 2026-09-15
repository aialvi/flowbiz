<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to workflow</a>
    <header class="app-header"><a href="/" class="brand">Flowbiz</a><span>Conversation workflow</span></header>
    <main id="main-content" tabindex="-1"><RouterView /></main>
  </div>
</template>
