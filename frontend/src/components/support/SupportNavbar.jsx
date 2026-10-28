import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  User,
  Users,
  IndianRupee,
  LogOut,
  Menu,
  ChevronLeft,
  ReceiptText,
} from "lucide-react";

export default function SupportNavbar({
  user,
  menuOpen,
  setMenuOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  handleLogout,
}) {

  return (
    <>
      <aside
        className={`support-sidebar ${menuOpen ? "sidebar-open" : ""} ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="support-sidebar-header">
          <div className="support-brand">
            <span className="support-brand-mark">
              <img src="/subflow-logo.png" alt="SubFlow logo" />
            </span>

            <span className="support-brand-name">SubFlow</span>

            <button
              type="button"
              className="desktop-menu-button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={
                sidebarCollapsed ? "Expand navigation" : "Collapse navigation"
              }
            >
              {sidebarCollapsed ? (
                <Menu size={19} />
              ) : (
                <ChevronLeft size={19} />
              )}
            </button>
          </div>
        </div>

        <div className="support-sidebar-divider" />

        <nav className="support-nav">
          <p className="support-nav-label">WORKSPACE</p>

          <NavLink
            to="/support"
            end
            className={({ isActive }) =>
              `support-nav-item ${isActive ? "active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
            title="Dashboard"
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
            <span className="support-active-dot" />
          </NavLink>

          <NavLink
            to="/support/tickets"
            className={({ isActive }) =>
              `support-nav-item ${isActive ? "active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
            title="My Tickets"
          >
            <Ticket size={17} />
            <span>My Tickets</span>
            <span className="support-active-dot" />
          </NavLink>
          <NavLink
              to="/support/customers"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
              title="Customers"
            >
              <Users size={17} />

              <span>Customers</span>

              <span className="active-dot" />
            </NavLink>
          <NavLink
              to="/support/billings"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
              title="Billing & Payments"
            >
              <IndianRupee size={17} />

              <span>Billing & Payments</span>

              <span className="active-dot" />
            </NavLink>
          
          {user?.supportSpecialization === "PAYMENT" && (
            <NavLink
              to="/support/refunds"
              className={({ isActive }) =>
                `support-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
              title="Refund Requests"
            >
              <ReceiptText size={17} />
              <span>Refund Requests</span>
              <span className="support-active-dot" />
            </NavLink>
          )}
          <p className="support-nav-label support-nav-label-account">ACCOUNT</p>

          <NavLink
            to="/support/profile"
            className={({ isActive }) =>
              `support-nav-item ${isActive ? "active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
            title="Profile"
          >
            <User size={17} />
            <span>Profile</span>
            <span className="support-active-dot" />
          </NavLink>
        </nav>

        <div className="support-sidebar-footer">
          <div className="support-user">
            <div className="support-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div className="support-user-info">
              <strong>{user?.name || "Support Agent"}</strong>

              <span>Support Agent</span>
            </div>
          </div>

          <button
            type="button"
            className="support-logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="support-mobile-header">
        <button
          type="button"
          className="support-mobile-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div className="support-mobile-brand">
          <span className="support-brand-mark">
            <img src="/subflow-logo.png" alt="SubFlow logo" />
          </span>

          <span className="support-brand-name">SubFlow</span>
        </div>

        <button
          type="button"
          className="support-mobile-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        >
          ×
        </button>
      </header>

      {menuOpen && (
        <div
          className="support-sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
