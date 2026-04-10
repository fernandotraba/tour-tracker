import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth";
import { verifyGoogleToken } from "../api";
import type { AuthResponse } from "@tour-tracker/shared";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useGoogleLogin({
    hosted_domain: "traba.work",
    onSuccess: async (response) => {
      setLoading(true);
      setError(null);
      try {
        const data: AuthResponse = await verifyGoogleToken(response.access_token);
        // id_token is the Google Identity JWT — what Traba API uses for auth
        const googleToken = (response as unknown as { id_token?: string }).id_token ?? response.access_token;
        login({ email: data.email, name: data.name, picture: data.picture, token: data.token, googleToken });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in failed"),
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--white)",
    }}>
      <div style={{ width: 360, textAlign: "center" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "var(--violet-60)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 20, fontWeight: 600 }}>T</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--midnight-100)" }}>Traba</span>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 6 }}>
            Tour Tracker
          </h1>
          <p style={{ fontSize: 13, color: "var(--gray-60)", marginBottom: 28 }}>
            Reach Facility — Sign in with your Traba account
          </p>

          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", height: 40, gap: 10 }}
            onClick={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? "Signing in…" : "Sign in with Google"}
          </button>

          {error && (
            <p style={{ marginTop: 14, fontSize: 12, color: "var(--red-70)" }}>{error}</p>
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: 11, color: "var(--gray-50)" }}>
          Restricted to @traba.work accounts
        </p>
      </div>
    </div>
  );
}
