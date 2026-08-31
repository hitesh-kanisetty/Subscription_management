import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Users,
  RefreshCw,
  IndianRupee,
  CircleHelp,
  UserCircle,
  LogOut,
} from "lucide-react";

export default function AdminNavbar({
  user,
  menuOpen,
  setMenuOpen,
  handleLogout,
}) {
  return (
    <>
      <aside
        className={`dashboard-sidebar ${
          menuOpen ? "is-open" : ""
        }`}
      >
        {/* Brand */}
        <div className="brand">
          <span className="brand-mark">
            <img
              src="/subflow-logo.png"
              alt="SubFlow logo"
            />
          </span>

          <span>SubFlow</span>
        </div>

        <div className="sidebar-rule" />

        {/* Navigation */}
        <nav aria-label="Admin navigation">
          {/* MAIN */}
          <div className="nav-group">
            <p className="nav-label">MAIN</p>

            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard size={17} />

              <span>Dashboard</span>

              <span className="active-dot" />
            </NavLink>
          </div>

          {/* MANAGEMENT */}
          <div className="nav-group">
            <p className="nav-label">MANAGEMENT</p>

            <NavLink
              to="/admin/plans"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <Layers size={17} />

              <span>Plans & Subscriptions</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <Users size={17} />

              <span>Customers</span>

              <span className="active-dot" />
            </NavLink>
          </div>

          {/* OPERATIONS */}
          <div className="nav-group">
            <p className="nav-label">OPERATIONS</p>

            <NavLink
              to="/admin/renewals"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <RefreshCw size={17} />

              <span>Renewals</span>

              <span className="active-dot" />
            </NavLink>
            <NavLink
              to="/admin/billings"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <IndianRupee size={17} />

              <span>Billing & Payments</span>

              <span className="active-dot" />
            </NavLink>

            <NavLink
              to="/admin/support"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <CircleHelp size={17} />

              <span>Support</span>

              <span className="active-dot" />
            </NavLink>
          </div>

          {/* ACCOUNT */}
          <div className="nav-group">
            <p className="nav-label">ACCOUNT</p>

            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <UserCircle size={17} />

              <span>Admin Profile</span>

              <span className="active-dot" />
            </NavLink>

            <button
              type="button"
              className="nav-item logout-item"
              onClick={handleLogout}
            >
              <LogOut size={17} />

              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Profile */}
        <div className="sidebar-footer">
          <div className="profile-avatar">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name}</strong>

            <small>{user?.email}</small>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        type="button"
      >
        {menuOpen ? "×" : "☰"}
      </button>
    </>
  );
}