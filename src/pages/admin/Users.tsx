import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  
  const { data: users } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm theo email hoặc tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatar_url || undefined} /><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
                    <span className="font-medium">{user.full_name || 'Chưa đặt tên'}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
