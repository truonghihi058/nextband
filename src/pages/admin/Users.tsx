import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useServerPagination } from '@/hooks/useServerPagination';
import { DataTablePagination } from '@/components/admin/DataTablePagination';

type SortField = 'full_name' | 'email' | 'created_at';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    page,
    pageSize,
    sortField,
    sortOrder,
    setPage,
    setPageSize,
    toggleSort,
    resetPage,
    getRange,
  } = useServerPagination<SortField>('created_at', 10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      resetPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, resetPage]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, sortField, sortOrder, page, pageSize],
    queryFn: async () => {
      const { from, to } = getRange();
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);
      
      if (debouncedSearch) {
        query = query.or(`email.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
      }
      
      const { data, count, error } = await query;
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        currentPage: page,
        perPage: pageSize,
        lastPage: Math.ceil((count || 0) / pageSize),
      };
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Đã cập nhật trạng thái người dùng' });
    },
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm theo email hoặc tên..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-10" 
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="full_name">Người dùng</SortHeader>
              <SortHeader field="email">Email</SortHeader>
              <SortHeader field="created_at">Ngày tạo</SortHeader>
              <TableHead>Kích hoạt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Đang tải...</TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : data?.data.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.full_name || 'Chưa đặt tên'}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.is_active ?? true}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: user.id, is_active: checked })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {data && (
          <DataTablePagination
            currentPage={data.currentPage}
            totalPages={data.lastPage}
            pageSize={pageSize}
            totalItems={data.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
