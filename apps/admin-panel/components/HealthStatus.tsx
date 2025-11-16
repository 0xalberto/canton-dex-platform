'use client';

import { SystemHealth, ServiceHealth, HealthStatus as HealthStatusEnum } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/lib/utils';
import { Activity, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface HealthStatusProps {
  health: SystemHealth;
}

function getHealthIcon(status: HealthStatusEnum) {
  switch (status) {
    case HealthStatusEnum.HEALTHY:
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case HealthStatusEnum.DEGRADED:
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case HealthStatusEnum.DOWN:
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Activity className="h-5 w-5 text-gray-600" />;
  }
}

function ServiceHealthItem({ service }: { service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {getHealthIcon(service.status)}
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-xs text-muted-foreground">
            Uptime: {service.uptime.toFixed(2)}%
            {service.responseTime && ` | Response: ${service.responseTime}ms`}
          </p>
        </div>
      </div>
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(service.status)}`}>
        {service.status}
      </span>
    </div>
  );
}

export function HealthStatus({ health }: HealthStatusProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Status</CardTitle>
            <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(health.status)}`}>
              {health.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date(health.lastChecked).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Services</h3>
        {health.services.map((service, index) => (
          <ServiceHealthItem key={index} service={service} />
        ))}
      </div>
    </div>
  );
}
