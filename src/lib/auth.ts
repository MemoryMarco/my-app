import type { AuthUser } from '@shared/types';
const TOKEN_KEY = 'liuyan_auth_token';
const USER_KEY = 'liuyan_auth_user';
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getCurrentUser(): AuthUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}
export function loginWithToken(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
}
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth-change'));
}
export function isLoggedIn(): boolean {
  return !!getToken();
}