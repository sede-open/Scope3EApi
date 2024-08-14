import { HeaderInit, Response as FetchResponse } from 'node-fetch';

export interface FetchOptions<T> {
  body?: T;
  headers?: HeaderInit;
  queryParams?: Record<string, string>;
}

export interface Response<T> extends FetchResponse {
  json(): Promise<T>;
}
