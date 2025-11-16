<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" />
        <v-list-item prepend-icon="mdi-file-document" title="Audit Log" to="/audit-log" />
        <v-list-item
          prepend-icon="mdi-security"
          title="Surveillance"
          to="/surveillance"
        />
        <v-list-item prepend-icon="mdi-account-check" title="KYC" to="/kyc" />
        <v-list-item prepend-icon="mdi-chart-box" title="Reports" to="/reports" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>CantonDEX - Compliance Dashboard</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-bell" />
      <v-btn icon="mdi-account-circle" />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)
</script>

<style scoped>
/* Component specific styles */
</style>
