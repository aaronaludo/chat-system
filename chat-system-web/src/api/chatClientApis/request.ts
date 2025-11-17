import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { toError } from './errors';

const resolvePath = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const buildWsUrl = (path: string): string => {
  const url = new URL(resolvePath(path));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface RequestInit {
  method?: string;
  data?: unknown;
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  try {
    const response = await httpClient.request<T>({
      url: path,
      method: init.method ?? 'GET',
      data: init.data,
    });
    return response.data;
  } catch (error) {
    throw toError(error);
  }
};

export { buildWsUrl, request };
export type { RequestInit };
