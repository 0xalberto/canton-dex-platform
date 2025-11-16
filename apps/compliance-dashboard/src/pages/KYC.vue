<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-3xl font-bold mb-6">KYC Management</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-row align="center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Search users"
                  single-line
                  hide-details
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6" class="text-right">
                <v-btn color="primary" prepend-icon="mdi-plus">
                  New KYC Request
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="kycRequests"
              :search="search"
              :loading="loading"
              item-value="id"
            >
              <template #item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small">
                  {{ item.status }}
                </v-chip>
              </template>

              <template #item.actions="{ item }">
                <v-btn icon="mdi-eye" size="small" variant="text" />
                <v-btn icon="mdi-pencil" size="small" variant="text" />
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

interface KYCRequest {
  id: string
  userId: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

const search = ref('')
const loading = ref(false)
const kycRequests = ref<KYCRequest[]>([])

const headers = [
  { title: 'User ID', key: 'userId', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Submitted', key: 'submittedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red'
  }
  return colors[status] || 'grey'
}

onMounted(() => {
  // TODO: Fetch KYC requests from API
  loading.value = true
  setTimeout(() => {
    kycRequests.value = []
    loading.value = false
  }, 1000)
})
</script>
