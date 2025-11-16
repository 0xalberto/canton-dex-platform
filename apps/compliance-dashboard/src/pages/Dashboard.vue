<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-3xl font-bold mb-6">Compliance Dashboard</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Active Alerts</div>
            <div class="text-h4">{{ stats.activeAlerts }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Pending KYC</div>
            <div class="text-h4">{{ stats.pendingKyc }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Transactions Today</div>
            <div class="text-h4">{{ stats.transactionsToday }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Risk Score</div>
            <div class="text-h4">{{ stats.riskScore }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-card-text>
            <p class="text-gray-500">Activity feed will be displayed here</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface DashboardStats {
  activeAlerts: number
  pendingKyc: number
  transactionsToday: number
  riskScore: number
}

const stats = ref<DashboardStats>({
  activeAlerts: 0,
  pendingKyc: 0,
  transactionsToday: 0,
  riskScore: 0
})

onMounted(() => {
  // TODO: Fetch real data from API
  stats.value = {
    activeAlerts: 5,
    pendingKyc: 12,
    transactionsToday: 1247,
    riskScore: 7.2
  }
})
</script>
