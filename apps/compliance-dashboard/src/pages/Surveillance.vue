<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-3xl font-bold mb-6">Market Surveillance</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Active Alerts</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="alert in alerts" :key="alert.id">
                <template #prepend>
                  <v-icon :color="alert.severity === 'high' ? 'error' : 'warning'">
                    mdi-alert
                  </v-icon>
                </template>
                <v-list-item-title>{{ alert.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ alert.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Suspicious Patterns</v-card-title>
          <v-card-text>
            <p class="text-gray-500">Pattern detection analysis will be displayed here</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Alert {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

const alerts = ref<Alert[]>([])

onMounted(() => {
  // TODO: Fetch alerts from API
  alerts.value = []
})
</script>
