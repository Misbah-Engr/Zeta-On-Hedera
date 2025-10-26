import { NavLink, Outlet } from "react-router-dom";
import { AppViewContext } from "../types";
import { HashpackConnector } from "./HashpackConnector";

interface AppLayoutProps {
  context: AppViewContext;
}

export function AppLayout({ context }: AppLayoutProps) {
  const { access, connected } = context;

  const navItems = [
    { to: "/", label: "Overview" },
    { to: "/shipments", label: "Send & Track" },
    {
      to: "/agents",
      label: "Agent Hub",
      badge: access.isAgent ? undefined : "Apply"
    },
    { to: "/disputes", label: "Disputes" },
    {
      to: "/system",
      label: "System",
      locked: !(access.roles.policyAdmin || access.roles.defaultAdmin)
    }
  ];

  return (
    <div className="app-frame">
      <header className="top-bar">
        <div className="brand-mark">
          <span className="brand-icon">Z</span>
          <div className="brand-copy">
            <strong>Zeta</strong>
            <span>Onchain logistics</span>
          </div>
        </div>
        <nav className="main-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "nav-link",
                  isActive ? "active" : "",
                  item.locked ? "locked" : "",
                  !connected && item.to !== "/" ? "disabled" : ""
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              title={item.locked ? "Admin access required" : undefined}
            >
              <span>{item.label}</span>
              {item.badge && <span className="nav-pill">{item.badge}</span>}
              {item.locked && <span className="nav-pill">Locked</span>}
            </NavLink>
          ))}
        </nav>
        <HashpackConnector />
      </header>
      <main className="page-shell">
        <Outlet context={context} />
      </main>
    </div>
  );
}
