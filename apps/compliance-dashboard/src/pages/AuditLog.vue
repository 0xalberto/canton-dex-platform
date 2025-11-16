<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-3xl font-bold mb-6">Audit Log</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search audit logs"
              single-line
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="auditLogs"
              :search="search"
              :loading="loading"
              item-value="id"
            >
              <template #item.timestamp="{ item }">
                {{ new Date(item.timestamp).toLocaleString() }}
              </template>

              <template #item.severity="{ item }">
                <v-chip :color="getSeverityColor(item.severity)" size="small">
                  {{ item.severity }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  severity: 'low' | 'medium' | 'high'
}

const search = ref('')
const loading = ref(false)
const auditLogs = ref<AuditLog[]>([])

const headers = [
  { title: 'Timestamp', key: 'timestamp', sortable: true },
  { title: 'User', key: 'user', sortable: true },
  { title: 'Action', key: 'action', sortable: true },
  { title: 'Resource', key: 'resource', sortable: true },
  { title: 'Severity', key: 'severity', sortable: true }
]

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red'
  }
  return colors[severity] || 'grey'
}

onMounted(() => {
  // TODO: Fetch audit logs from API
  loading.value = true
  setTimeout(() => {
    auditLogs.value = []
    loading.value = false
  }, 1000)
})
</script>
