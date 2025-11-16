'use client';

import { useEffect, useState } from 'react';
import { SystemHealth, HealthStatus as HealthStatusEnum } from '@/types';
import { HealthStatus } from '@/components/HealthStatus';
import { apiUtils } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    const response = await apiUtils.getSystemHealth();
    if (response.success && response.data) {
      setHealth(response.data as SystemHealth);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system services and health status
          </p>
        </div>
        <Button onClick={loadHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : health ? (
        <HealthStatus health={health} />
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Unable to load health data</p>
        </div>
      )}
    </div>
  );
}
