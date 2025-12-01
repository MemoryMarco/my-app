import { ApiResponse } from "../../shared/types"
import { getToken } from "./auth";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  try {
    const res = await fetch(path, { ...init, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    let json: ApiResponse<T>;
    try {
      json = await res.json();
    } catch (e) {
      // Handle cases where the response is not valid JSON
      console.error('API Error: Failed to parse JSON response.', { status: res.status, statusText: res.statusText });
      throw new Error(`Request failed with status ${res.status}: Not a valid JSON response.`);
    }
    if (!res.ok || !json.success || json.data === undefined) {
      console.error('API Error:', json.error || `Request failed with status ${res.status}`);
      throw new Error(json.error || `Request failed with status ${res.status}`);
    }
    return json.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    // Re-throw other errors to be caught by the caller
    throw error;
  }
}