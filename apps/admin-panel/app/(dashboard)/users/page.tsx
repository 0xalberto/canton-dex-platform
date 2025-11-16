'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserTable } from '@/components/UserTable';
import { User } from '@/types';
import { apiUtils } from '@/lib/api';
import { Plus, Search } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const response = await apiUtils.getUsers({ search });
    if (response.success && response.data) {
      setUsers(response.data.data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const response = await apiUtils.deleteUser(userId);
      if (response.success) {
        loadUsers();
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, permissions, and KYC status
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Total: {filteredUsers.length} users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <UserTable users={filteredUsers} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
