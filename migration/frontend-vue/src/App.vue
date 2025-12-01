<template>
  <div class="relative min-h-screen bg-background font-sans">
    <header class="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-foreground">留声 (Vue)</h1>
        </div>
        <nav class="flex items-center gap-4">
          <RouterLink to="/" class="text-sm font-medium hover:underline">Home</RouterLink>
          <RouterLink to="/settings" class="text-sm font-medium hover:underline">Settings</RouterLink>
        </nav>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-8 md:py-10 lg:py-12">
        <RouterView />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>