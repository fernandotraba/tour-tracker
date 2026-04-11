import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthContext, loadSession, saveSession, clearSession } from "./auth";
import type { AuthState } from "./auth";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import OnsiteTab from "./components/OnsiteTab";
import GWOpsTab from "./components/GWOpsTab";
import NYWOpsTab from "./components/NYWOpsTab";
import { IS_MOCK } from "./mock";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function App() {
  const [user, setUser] = useState<AuthState | null>(loadSession);

  function login(state: AuthState) {
    saveSession(state);
    setUser(state);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          {!user ? (
            <>
              <Route
                path="/login"
                element={
                  IS_MOCK ? (
                    <LoginPage />
                  ) : googleClientId ? (
                    <GoogleOAuthProvider clientId={googleClientId}>
                      <LoginPage />
                    </GoogleOAuthProvider>
                  ) : (
                    <div style={{ padding: 24, color: "var(--red-70)", fontFamily: "Poppins, sans-serif" }}>
                      VITE_GOOGLE_CLIENT_ID is not configured.
                    </div>
                  )
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route element={<Layout />}>
                <Route path="/onsite" element={<OnsiteTab />} />
                <Route path="/gwops" element={<GWOpsTab />} />
                <Route path="/nywops" element={<NYWOpsTab />} />
                <Route path="*" element={<Navigate to="/onsite" replace />} />
              </Route>
            </>
          )}
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
