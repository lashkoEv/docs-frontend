export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}