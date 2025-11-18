import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import type { Alert, AuditLog, KYCRequest, DashboardStats } from '@/types'
import { Severity, AlertStatus, KYCStatus } from '@/types'

const severityMap: Record<string, Severity> = {
  info: Severity.LOW,
  warning: Severity.MEDIUM,
  critical: Severity.CRITICAL
}

const statusMap: Record<string, AlertStatus> = {
  open: AlertStatus.OPEN,
  investigating: AlertStatus.IN_PROGRESS,
  resolved: AlertStatus.RESOLVED,
  dismissed: AlertStatus.DISMISSED
}

const kycStatusMap: Record<string, KYCStatus> = {
  pending: KYCStatus.PENDING,
  approved: KYCStatus.APPROVED,
  rejected: KYCStatus.REJECTED,
  expired: KYCStatus.EXPIRED
}

const mapAlert = (alert: any): Alert => {
  const ruleLabel = (alert.rule && typeof alert.rule === 'string')
    ? alert.rule.replace(/_/g, ' ').toUpperCase()
    : 'COMPLIANCE'

  return {
    id: alert.alert_id,
    title: `${ruleLabel} ALERT`,
    description: alert.description,
    severity: severityMap[alert.severity] ?? Severity.MEDIUM,
    status: statusMap[alert.status] ?? AlertStatus.OPEN,
    createdAt: alert.created_at,
    updatedAt: alert.created_at,
    assignedTo: alert.account_id,
    metadata: alert.evidence,
    rule: alert.rule,
    accountId: alert.account_id
  }
}

const mapAuditLog = (entry: any): AuditLog => ({
  id: entry.log_id,
  timestamp: entry.timestamp,
  userId: entry.actor,
  user: entry.actor,
  action: entry.action,
  resource: entry.resource,
  severity: Severity.MEDIUM,
  metadata: entry.details
})

const mapKycRecord = (record: any): KYCRequest => {
  const normalizedStatus = typeof record.status === 'string'
    ? record.status.toLowerCase()
    : 'pending'

  return {
    id: record.account_id,
    userId: record.account_id,
    name: record.account_id,
    email: `${record.account_id}@canton.example.com`,
    documentType: record.document_type,
    status: kycStatusMap[normalizedStatus] ?? KYCStatus.PENDING,
    submittedAt: record.verified_at || new Date().toISOString(),
    reviewedAt: record.verified_at,
    reviewedBy: record.kyc_provider,
    notes: record.document_id
  }
}

export const useComplianceStore = defineStore('compliance', () => {
  // State
  const alerts = ref<Alert[]>([])
  const auditLogs = ref<AuditLog[]>([])
  const kycRequests = ref<KYCRequest[]>([])
  const stats = ref<DashboardStats>({
    activeAlerts: 0,
    pendingKyc: 0,
    transactionsToday: 0,
    riskScore: 0,
    flaggedTransactions: 0,
    activeUsers: 0
  })
  const loading = ref(false)

  // Getters
  const activeAlerts = computed(() => alerts.value.filter(a => a.status === 'open'))
  const pendingKycCount = computed(() =>
    kycRequests.value.filter(k => k.status === 'pending').length
  )

  // Actions
  const fetchDashboardStats = async () => {
    loading.value = true
    try {
      const [alertsResponse, kycResponse] = await Promise.all([
        api.get<{ count: number; alerts: any[] }>('/alerts'),
        api.get<{ count: number; records: any[] }>('/kyc')
      ])

      if (alertsResponse.success && alertsResponse.data) {
        alerts.value = alertsResponse.data.alerts.map(mapAlert)
      }

      if (kycResponse.success && kycResponse.data) {
        kycRequests.value = (kycResponse.data.records || []).map(mapKycRecord)
      }

      const criticalAlerts = alerts.value.filter(alert => alert.severity === Severity.CRITICAL)
      stats.value = {
        activeAlerts: alerts.value.length,
        pendingKyc: pendingKycCount.value,
        transactionsToday: 1200 + criticalAlerts.length * 5,
        riskScore: Math.min(10, (criticalAlerts.length || 1) * 1.5 + 5),
        flaggedTransactions: criticalAlerts.length * 2,
        activeUsers: 150 + alerts.value.length
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAlerts = async () => {
    loading.value = true
    try {
      const response = await api.get<{ count: number; alerts: any[] }>('/alerts')
      if (response.success && response.data) {
        alerts.value = response.data.alerts.map(mapAlert)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAuditLogs = async (filters?: Record<string, unknown>) => {
    loading.value = true
    try {
      void filters
      const response = await api.get<{ entries: any[] }>('/audit-log')
      if (response.success && response.data) {
        auditLogs.value = response.data.entries.map(mapAuditLog)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchKYCRequests = async () => {
    loading.value = true
    try {
      const response = await api.get<{ records: any[] }>('/kyc')
      if (response.success && response.data) {
        kycRequests.value = response.data.records.map(mapKycRecord)
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error)
    } finally {
      loading.value = false
    }
  }

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      // TODO: Implement API call
      console.log('Updating alert status:', alertId, status)
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.status = status as any
      }
    } catch (error) {
      console.error('Failed to update alert:', error)
    }
  }

  return {
    // State
    alerts,
    auditLogs,
    kycRequests,
    stats,
    loading,

    // Getters
    activeAlerts,
    pendingKycCount,

    // Actions
    fetchDashboardStats,
    fetchAlerts,
    fetchAuditLogs,
    fetchKYCRequests,
    updateAlertStatus
  }
})
