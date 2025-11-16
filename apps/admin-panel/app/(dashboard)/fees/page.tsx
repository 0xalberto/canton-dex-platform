'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeeConfig } from '@/types';
import { apiUtils } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Plus, Edit } from 'lucide-react';

export default function FeesPage() {
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    setLoading(true);
    const response = await apiUtils.getFeeConfigs();
    if (response.success && response.data) {
      setFees(response.data as FeeConfig[]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Configuration</h1>
          <p className="text-muted-foreground">
            Manage trading fees and withdrawal fees
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Config
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Configurations</CardTitle>
          <CardDescription>
            Configure fees for different user roles and trading pairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Maker Fee</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Taker Fee</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Withdrawal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Deposit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Default</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        {fee.userRole || fee.tradingPairId || 'Default'}
                      </td>
                      <td className="px-4 py-3">{formatNumber(fee.makerFee, 4)}%</td>
                      <td className="px-4 py-3">{formatNumber(fee.takerFee, 4)}%</td>
                      <td className="px-4 py-3">{formatNumber(fee.withdrawalFee, 4)}%</td>
                      <td className="px-4 py-3">{formatNumber(fee.depositFee, 4)}%</td>
                      <td className="px-4 py-3">
                        {fee.isDefault ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
