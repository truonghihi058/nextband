import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
}

export function useServerPagination<T extends string>(
  defaultSort: T,
  defaultPageSize: number = 10
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState<T>(defaultSort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSort = useCallback((field: T) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortField]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const getRange = useCallback(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    sortField,
    sortOrder,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    toggleSort,
    resetPage,
    getRange,
  };
}
