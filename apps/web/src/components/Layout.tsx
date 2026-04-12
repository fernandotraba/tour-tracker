import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import { googleLogout } from "@react-oauth/google";
import { IS_MOCK } from "../mock";

export default function Layout() {
  const { user, logout } = useAuth();

  function handleLogout() {
    if (!IS_MOCK) googleLogout();
    logout();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 154,
        background: "var(--white)", borderRight: "1px solid var(--gray-20)",
        display: "flex", flexDirection: "column", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "16px 14px 14px", borderBottom: "1px solid var(--gray-20)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: "var(--violet-60)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>T</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--midnight-100)" }}>Traba</span>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 500, color: "var(--gray-50)",
            textTransform: "uppercase", letterSpacing: "0.8px",
            padding: "0 6px", marginBottom: 4,
          }}>
            Tour Tracker
          </div>

          {[
            { to: "/onsite", label: "Onsite Entry", icon: <UsersIcon /> },
            { to: "/gwops", label: "GWOps Queue", icon: <TableIcon /> },
            { to: "/nywops", label: "NY WOps Queue", icon: <CheckIcon /> },
          ].map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 500, textDecoration: "none",
                color: isActive ? "var(--violet-60)" : "var(--gray-70)",
                background: isActive ? "var(--violet-10)" : "transparent",
                transition: "background 0.15s",
              })}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--gray-20)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {user.picture ? (
                <img
                  src={user.picture} alt={user.name}
                  referrerPolicy="no-referrer"
                  style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "var(--violet-60)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white", fontSize: 11, fontWeight: 600,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--midnight-100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name.split(" ")[0]}
                </div>
                <div style={{ fontSize: 10, color: "var(--gray-60)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", height: 28, borderRadius: 6, border: "1px solid var(--gray-20)",
                background: "var(--white)", color: "var(--gray-70)",
                fontFamily: "Poppins, sans-serif", fontSize: 11, fontWeight: 500, cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Topbar ── */}
      <header style={{
        position: "fixed", left: 154, top: 0, right: 0, height: 52,
        background: "var(--white)", borderBottom: "1px solid var(--gray-20)",
        zIndex: 90, display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--midnight-100)" }}>Tour Tracker</span>
        <span style={{ fontSize: 12, color: "var(--gray-60)" }}>Reach Facility</span>
        {IS_MOCK && (
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 600,
            background: "var(--orange-10, #fff3e0)", color: "var(--orange-70, #b45300)",
            border: "1px solid var(--orange-30, #ffb74d)",
            borderRadius: 6, padding: "3px 10px",
          }}>
            DEMO MODE — data is not saved
          </span>
        )}
      </header>

      {/* ── Main ── */}
      <main style={{
        position: "fixed", left: 154, top: 52, right: 0, bottom: 0,
        overflowY: "auto", background: "var(--white)", padding: "24px",
      }}>
        <Outlet />
      </main>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}
