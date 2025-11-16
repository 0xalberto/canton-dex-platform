'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradingPair } from '@/types';
import { apiUtils } from '@/lib/api';
import { getStatusColor, formatNumber } from '@/lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function TradingPairsPage() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTradingPairs();
  }, []);

  const loadTradingPairs = async () => {
    setLoading(true);
    const response = await apiUtils.getTradingPairs();
    if (response.success && response.data) {
      setPairs(response.data as TradingPair[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this trading pair?')) {
      const response = await apiUtils.deleteTradingPair(id);
      if (response.success) {
        loadTradingPairs();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Pairs</h1>
          <p className="text-muted-foreground">
            Configure and manage trading pairs
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Trading Pair
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>
            Total: {pairs.length} pairs
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Symbol</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Base Asset</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Quote Asset</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Min Order</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Max Order</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pairs.map((pair) => (
                    <tr key={pair.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{pair.symbol}</td>
                      <td className="px-4 py-3">{pair.baseAsset}</td>
                      <td className="px-4 py-3">{pair.quoteAsset}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(pair.status)}`}>
                          {pair.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatNumber(pair.minOrderSize, 8)}</td>
                      <td className="px-4 py-3 text-sm">{formatNumber(pair.maxOrderSize, 8)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(pair.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
