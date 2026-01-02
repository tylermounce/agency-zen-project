import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number | null;
}

export interface UsePaginationOptions {
  initialPageSize?: number;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const { initialPageSize = 50 } = options;

  const [state, setState] = useState<PaginationState>({
    page: 0,
    pageSize: initialPageSize,
    hasMore: true,
    total: null
  });

  const reset = useCallback(() => {
    setState({
      page: 0,
      pageSize: initialPageSize,
      hasMore: true,
      total: null
    });
  }, [initialPageSize]);

  const setHasMore = useCallback((hasMore: boolean) => {
    setState(prev => ({ ...prev, hasMore }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setState(prev => ({ ...prev, total }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const getRange = useCallback(() => {
    const from = state.page * state.pageSize;
    const to = from + state.pageSize - 1;
    return { from, to };
  }, [state.page, state.pageSize]);

  return {
    ...state,
    reset,
    setHasMore,
    setTotal,
    nextPage,
    getRange
  };
};

// Helper to calculate pagination info from Supabase response
export const calculateHasMore = (
  fetchedCount: number,
  pageSize: number,
  currentPage: number,
  total?: number
): boolean => {
  if (total !== undefined) {
    return (currentPage + 1) * pageSize < total;
  }
  return fetchedCount === pageSize;
};
