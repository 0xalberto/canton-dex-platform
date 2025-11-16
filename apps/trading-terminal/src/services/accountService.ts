import api from './api'
import { Account, Asset, DepositFormData, WithdrawFormData } from '@types/index'

export const accountService = {
  async getAccount(): Promise<Account> {
    const response = await api.get<Account>('/accounts/me')
    return response.data
  },

  async getAssets(): Promise<Asset[]> {
    const response = await api.get<Asset[]>('/accounts/me/assets')
    return response.data
  },

  async getAssetBalance(symbol: string): Promise<Asset> {
    const response = await api.get<Asset>(`/accounts/me/assets/${symbol}`)
    return response.data
  },

  async updateAccountSettings(settings: Record<string, any>): Promise<Account> {
    const response = await api.put<Account>('/accounts/me', settings)
    return response.data
  },

  async getDepositAddress(asset: string): Promise<{ address: string; qrCode: string }> {
    const response = await api.get<{ address: string; qrCode: string }>(
      `/accounts/me/deposit-address/${asset}`
    )
    return response.data
  },

  async generateNewDepositAddress(asset: string): Promise<{ address: string; qrCode: string }> {
    const response = await api.post<{ address: string; qrCode: string }>(
      `/accounts/me/deposit-address/${asset}/generate`
    )
    return response.data
  },

  async requestWithdrawal(data: WithdrawFormData): Promise<{ withdrawalId: string }> {
    const response = await api.post<{ withdrawalId: string }>('/accounts/me/withdrawals', data)
    return response.data
  },

  async getWithdrawalHistory(
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    data: any[]
    total: number
  }> {
    const response = await api.get('/accounts/me/withdrawals', {
      params: { limit, offset },
    })
    return response.data
  },

  async getDepositHistory(
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    data: any[]
    total: number
  }> {
    const response = await api.get('/accounts/me/deposits', {
      params: { limit, offset },
    })
    return response.data
  },

  async getAccountActivityLog(
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    data: any[]
    total: number
  }> {
    const response = await api.get('/accounts/me/activity', {
      params: { limit, offset },
    })
    return response.data
  },
}
