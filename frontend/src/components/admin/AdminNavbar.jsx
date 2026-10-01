import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Layers,
  CreditCard,
  Users,
  RefreshCw,
  IndianRupee,
  CircleHelp,
  ChartNoAxesCombined,
  FileText,
  UserCircle,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

import NotificationBell from "../NotificationBell";

export default function AdminNavbar({
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
        className={`dashboard-sidebar ${
          menuOpen ? "is-open" : ""
        } ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
       
        <div className="brand">
          <span className="brand-mark">
            <img
              src="/subflow-logo.png"
              alt="SubFlow logo"
            />
          </span>

          <span className="brand-name">
            SubFlow
          </span>

          {/* DESKTOP ONLY */}
          <button
            type="button"
            className="desktop-menu-button"
            onClick={() =>
              setSidebarCollapsed((prev) => !prev)
            }
            aria-label={
              sidebarCollapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
          >
            {sidebarCollapsed ? (
              <Menu size={19} />
            ) : (
              <ChevronLeft size={19} />
            )}
          </button>
        </div>

        <div className="sidebar-rule" />

        
        <nav aria-label="Admin navigation">

          {/* MAIN */}

          <div className="nav-group">
            <p className="nav-label">MAIN</p>

            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Dashboard"
            >
              <LayoutDashboard size={17} />

              <span>Dashboard</span>

              <span className="active-dot" />
            </NavLink>
          </div>


          {/* MANAGEMENT */}

          <div className="nav-group">
            <p className="nav-label">
              MANAGEMENT
            </p>

            <NavLink
              to="/admin/plans"
              end
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Plans"
            >
              <Layers size={17} />

              <span>Plans</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/subscriptions"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Subscriptions"
            >
              <CreditCard size={17} />

              <span>Subscriptions</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Customers"
            >
              <Users size={17} />

              <span>Customers</span>

              <span className="active-dot" />
            </NavLink>
          </div>


          {/* OPERATIONS */}

          <div className="nav-group">
            <p className="nav-label">
              OPERATIONS
            </p>

            <NavLink
              to="/admin/renewals"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Renewals"
            >
              <RefreshCw size={17} />

              <span>Renewals</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/billings"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Billing & Payments"
            >
              <IndianRupee size={17} />

              <span>Billing & Payments</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/support"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Support"
            >
              <CircleHelp size={17} />

              <span>Support</span>

              <span className="active-dot" />
            </NavLink>
          </div>


          {/* ANALYTICS */}

          <div className="nav-group">
            <p className="nav-label">
              ANALYTICS
            </p>

            <NavLink
              to="/admin/financial-analytics"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Revenue"
            >
              <ChartNoAxesCombined size={17} />

              <span>Revenue</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Audit Logs"
            >
              <FileText size={17} />

              <span>Audit Logs</span>

              <span className="active-dot" />
            </NavLink>
          </div>


          {/* ACCOUNT */}

          <div className="nav-group">
            <p className="nav-label">
              ACCOUNT
            </p>

            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
              onClick={() => setMenuOpen(false)}
              title="Admin Profile"
            >
              <UserCircle size={17} />

              <span>Admin Profile</span>

              <span className="active-dot" />
            </NavLink>

            <button
              type="button"
              className="nav-item logout-item"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={17} />

              <span>Logout</span>
            </button>
          </div>

        </nav>


        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="sidebar-footer">
          <div className="profile-avatar">
            {user?.name
              ?.slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="sidebar-profile-info">
            <strong>{user?.name}</strong>

            <small>{user?.email}</small>
          </div>
        </div>
      </aside>


      {/* =====================================================
          MOBILE OVERLAY
          KEEP EXACTLY AS BEFORE
      ===================================================== */}

      <button
        type="button"
        className={`sidebar-overlay ${
          menuOpen ? "is-visible" : ""
        }`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close navigation"
        tabIndex={menuOpen ? 0 : -1}
      />


      {/* =====================================================
          MOBILE HEADER
          KEEP EXACTLY AS BEFORE
      ===================================================== */}

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
              <NotificationBell admin={true} />

              <button
                className="menu-button"
                onClick={() =>
                  setMenuOpen(true)
                }
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
            className="menu-button mobile-close-button"
            onClick={() =>
              setMenuOpen(false)
            }
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