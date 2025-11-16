import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.error?.message || 'API request failed');
          }
          return response.data as T;
        })
      );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.error?.message || 'API request failed');
          }
          return response.data as T;
        })
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.error?.message || 'API request failed');
          }
          return response.data as T;
        })
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.error?.message || 'API request failed');
          }
          return response.data as T;
        })
      );
  }

  /**
   * Paginated GET request
   */
  getPaginated<T>(
    endpoint: string,
    pagination: PaginationParams,
    filters?: any
  ): Observable<PaginatedResponse<T>> {
    const params = {
      page: pagination.page.toString(),
      pageSize: pagination.pageSize.toString(),
      ...(pagination.sortBy && { sortBy: pagination.sortBy }),
      ...(pagination.sortOrder && { sortOrder: pagination.sortOrder }),
      ...filters
    };

    return this.get<PaginatedResponse<T>>(endpoint, params);
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }
}
