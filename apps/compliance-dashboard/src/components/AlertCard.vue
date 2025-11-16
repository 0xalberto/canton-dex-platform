<template>
  <v-card :color="getCardColor()" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon :color="getSeverityColor()" class="mr-2">
        {{ getSeverityIcon() }}
      </v-icon>
      {{ alert.title }}
    </v-card-title>

    <v-card-text>
      <p>{{ alert.description }}</p>
      <div class="text-caption text-grey mt-2">
        Created: {{ formatDateTime(alert.createdAt) }}
      </div>
    </v-card-text>

    <v-card-actions>
      <v-chip :color="getStatusColor()" size="small">
        {{ alert.status }}
      </v-chip>
      <v-spacer />
      <v-btn size="small" variant="text" @click="$emit('view', alert.id)">
        View Details
      </v-btn>
      <v-btn
        v-if="alert.status === 'open'"
        size="small"
        color="primary"
        variant="text"
        @click="$emit('resolve', alert.id)"
      >
        Resolve
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Alert } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  alert: Alert
}

const props = defineProps<Props>()

defineEmits<{
  view: [id: string]
  resolve: [id: string]
}>()

const getSeverityColor = () => {
  const colors: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  }
  return colors[props.alert.severity] || 'grey'
}

const getSeverityIcon = () => {
  const icons: Record<string, string> = {
    low: 'mdi-information',
    medium: 'mdi-alert',
    high: 'mdi-alert-circle',
    critical: 'mdi-alert-octagon'
  }
  return icons[props.alert.severity] || 'mdi-alert'
}

const getStatusColor = () => {
  const colors: Record<string, string> = {
    open: 'error',
    in_progress: 'warning',
    resolved: 'success',
    dismissed: 'grey'
  }
  return colors[props.alert.status] || 'grey'
}

const getCardColor = computed(() => {
  if (props.alert.severity === 'critical') return 'red-lighten-5'
  if (props.alert.severity === 'high') return 'orange-lighten-5'
  return undefined
})
</script>
