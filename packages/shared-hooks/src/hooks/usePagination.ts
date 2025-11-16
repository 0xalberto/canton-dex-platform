import { useState, useMemo, useCallback } from 'react';

export interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  paginateData: <T>(data: T[]) => T[];
}

/**
 * Hook for managing pagination state and calculations
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   pageSize,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   nextPage,
 *   previousPage,
 *   paginateData,
 *   setTotalItems
 * } = usePagination({ initialPage: 1, initialPageSize: 10 });
 *
 * // Set total items from API response
 * setTotalItems(response.total);
 *
 * // Paginate array data
 * const paginatedData = paginateData(allData);
 *
 * // Navigate pages
 * nextPage();
 * previousPage();
 * ```
 */
export function usePagination(
  options: PaginationOptions = {}
): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotalItems = 0,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize) || 1,
    [totalItems, pageSize]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const hasNextPage = useMemo(
    () => currentPage < totalPages,
    [currentPage, totalPages]
  );

  const hasPreviousPage = useMemo(
    () => currentPage > 1,
    [currentPage]
  );

  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const handleSetPageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    },
    []
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const paginateData = useCallback(
    <T,>(data: T[]): T[] => {
      return data.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setPageSize: handleSetPageSize,
    setTotalItems,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    paginateData,
  };
}
