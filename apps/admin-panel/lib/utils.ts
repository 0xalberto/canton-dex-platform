import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatNumber(num: number | string, decimals: number = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(n);
}

export function truncateAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    ACTIVE: 'text-green-600 bg-green-50',
    HEALTHY: 'text-green-600 bg-green-50',
    APPROVED: 'text-green-600 bg-green-50',
    ONLINE: 'text-green-600 bg-green-50',

    PENDING: 'text-yellow-600 bg-yellow-50',
    SYNCING: 'text-yellow-600 bg-yellow-50',
    DEGRADED: 'text-yellow-600 bg-yellow-50',

    SUSPENDED: 'text-red-600 bg-red-50',
    DISABLED: 'text-red-600 bg-red-50',
    REJECTED: 'text-red-600 bg-red-50',
    DOWN: 'text-red-600 bg-red-50',
    ERROR: 'text-red-600 bg-red-50',
    OFFLINE: 'text-red-600 bg-red-50',

    INACTIVE: 'text-gray-600 bg-gray-50',
    HALTED: 'text-gray-600 bg-gray-50',
  };

  return statusColors[status] || 'text-gray-600 bg-gray-50';
}
