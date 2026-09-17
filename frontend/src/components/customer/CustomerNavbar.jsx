import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers3,
  CreditCard,
  RefreshCw,
  IndianRupee,
  CircleHelp,
  UserCircle,
  LogOut,
} from "lucide-react";

import NotificationBell from "../NotificationBell";

const navGroups = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/user",
        end: true,
      },
    ],
  },
  {
    label: "Subscription",
    items: [
      {
        label: "Plans",
        icon: Layers3,
        path: "/user/plans",
      },
      {
        label: "My Subscription",
        icon: CreditCard,
        path: "/user/subscription",
      },
      {
        label: "Renewals",
        icon: RefreshCw,
        path: "/user/renewals",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Billing & Payments",
        icon: IndianRupee,
        path: "/user/billing",
      },
      {
        label: "Support",
        icon: CircleHelp,
        path: "/user/support",
      },
      {
        label: "My Profile",
        icon: UserCircle,
        path: "/user/profile",
      },
    ],
  },
];

export default function CustomerNavbar({
  user,
  menuOpen,
  setMenuOpen,
  handleLogout,
}) {
  return (
    <>
      <aside
        className={`customer-sidebar ${
          menuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">
              <img
                src="/subflow-logo.png"
                alt="SubFlow logo"
              />
            </span>

            <span>SubFlow</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav
          className="customer-navigation"
          aria-label="Customer navigation"
        >
          {navGroups.map((group) => (
            <div
              className="nav-group"
              key={group.label}
            >
              <p className="nav-group-label">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive ? "active" : ""
                      }`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    <span>{item.label}</span>

                    <span className="active-indicator" />
                  </NavLink>
                );
              })}
            </div>
          ))}

          <button
            type="button"
            className="nav-item logout-item"
            onClick={handleLogout}
          >
            <LogOut
              size={18}
              strokeWidth={1.8}
            />

            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar-overlay ${
          menuOpen ? "is-visible" : ""
        }`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close navigation"
        tabIndex={menuOpen ? 0 : -1}
      />

      <div
        className={`mobile-nav-header ${
          menuOpen ? "sidebar-open" : ""
        }`}
      >
        {!menuOpen && (
          <>
            <div className="mobile-brand">
              <span className="mobile-brand-mark">
                <img
                  src="/subflow-logo.png"
                  alt="SubFlow logo"
                />
              </span>

              <span>SubFlow</span>
            </div>

            <div className="mobile-nav-actions">
              <NotificationBell />

              <button
                className="mobile-menu-button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
                type="button"
              >
                ☰
              </button>
            </div>
          </>
        )}

        {menuOpen && (
          <button
            className="mobile-menu-button mobile-close-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </>
  );
}