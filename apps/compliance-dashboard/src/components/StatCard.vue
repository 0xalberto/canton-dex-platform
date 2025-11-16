<template>
  <v-card :color="color" :class="['stat-card', { 'elevated': elevated }]">
    <v-card-text>
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-overline mb-1">{{ title }}</div>
          <div class="text-h4 font-weight-bold">{{ formattedValue }}</div>
          <div v-if="subtitle" class="text-caption text-grey mt-1">
            {{ subtitle }}
          </div>
        </div>
        <v-icon v-if="icon" :color="iconColor" size="48">
          {{ icon }}
        </v-icon>
      </div>

      <div v-if="trend" class="mt-3 d-flex align-center">
        <v-icon :color="trendColor" size="20">
          {{ trendIcon }}
        </v-icon>
        <span :class="`text-caption ml-1 ${trendColor}--text`">
          {{ trend }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, formatCurrency } from '@/utils/formatters'

interface Props {
  title: string
  value: number | string
  subtitle?: string
  icon?: string
  iconColor?: string
  color?: string
  elevated?: boolean
  format?: 'number' | 'currency' | 'percentage' | 'none'
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'none',
  elevated: false,
  iconColor: 'primary'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value

  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value)
    case 'number':
      return formatNumber(props.value)
    case 'percentage':
      return `${props.value}%`
    default:
      return props.value
  }
})

const trendIcon = computed(() => {
  switch (props.trendDirection) {
    case 'up':
      return 'mdi-trending-up'
    case 'down':
      return 'mdi-trending-down'
    default:
      return 'mdi-trending-neutral'
  }
})

const trendColor = computed(() => {
  switch (props.trendDirection) {
    case 'up':
      return 'success'
    case 'down':
      return 'error'
    default:
      return 'grey'
  }
})
</script>

<style scoped>
.stat-card.elevated {
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card.elevated:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}
</style>
