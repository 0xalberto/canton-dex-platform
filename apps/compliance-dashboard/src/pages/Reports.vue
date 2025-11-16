<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-3xl font-bold mb-6">Compliance Reports</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Generate Report</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedReportType"
              :items="reportTypes"
              label="Report Type"
              variant="outlined"
              density="compact"
            />

            <v-menu v-model="dateMenu" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-text-field
                  v-model="dateRange"
                  label="Date Range"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  variant="outlined"
                  density="compact"
                  v-bind="props"
                />
              </template>
            </v-menu>

            <v-btn color="primary" block class="mt-4">
              Generate Report
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Recent Reports</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="report in recentReports" :key="report.id">
                <template #prepend>
                  <v-icon>mdi-file-document</v-icon>
                </template>
                <v-list-item-title>{{ report.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ report.date }}</v-list-item-subtitle>
                <template #append>
                  <v-btn icon="mdi-download" size="small" variant="text" />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Report {
  id: string
  name: string
  type: string
  date: string
}

const selectedReportType = ref('')
const dateRange = ref('')
const dateMenu = ref(false)
const recentReports = ref<Report[]>([])

const reportTypes = [
  'Transaction Summary',
  'KYC Status Report',
  'Alert Summary',
  'Risk Assessment',
  'Audit Trail'
]

onMounted(() => {
  // TODO: Fetch recent reports from API
  recentReports.value = []
})
</script>
