import { createContext, useContext } from "react";
import type { SessionUser } from "@tour-tracker/shared";

export interface AuthState extends SessionUser {
  token: string;
}

export const AUTH_KEY = "tour_tracker_session";

export function loadSession(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function saveSession(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY);
}

export interface AuthContextType {
  user: AuthState | null;
  login: (state: AuthState) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
