'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CantonDomain, CantonParticipant } from '@/types';
import { apiUtils } from '@/lib/api';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Server, Users } from 'lucide-react';

export default function CantonManagementPage() {
  const [domains, setDomains] = useState<CantonDomain[]>([]);
  const [participants, setParticipants] = useState<CantonParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [domainsRes, participantsRes] = await Promise.all([
      apiUtils.getCantonDomains(),
      apiUtils.getCantonParticipants(),
    ]);

    if (domainsRes.success && domainsRes.data) {
      setDomains(domainsRes.data as CantonDomain[]);
    }
    if (participantsRes.success && participantsRes.data) {
      setParticipants(participantsRes.data as CantonParticipant[]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Canton Management</h1>
        <p className="text-muted-foreground">
          Monitor Canton domains and participants
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>Domains</CardTitle>
            </div>
            <CardDescription>
              Canton domains in the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                {domains.map((domain) => (
                  <div key={domain.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        <p className="text-xs text-muted-foreground">{domain.id}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(domain.status)}`}>
                        {domain.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Participants: {domain.connectedParticipants}</p>
                      <p>Created: {formatDate(domain.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Participants</CardTitle>
            </div>
            <CardDescription>
              Canton participants in the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.id}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(participant.status)}`}>
                        {participant.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Ledger ID: {participant.ledgerId}</p>
                      <p>Domains: {participant.domains.length}</p>
                      <p>Created: {formatDate(participant.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
