import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SupportNavbar from "./SupportNavbar";
import API_URL from "../../config";
import { useTheme } from "../../context/ThemeContext";
// import "./SupportDashboard.css";

export default function SupportLayout() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mobile sidebar state
  const [menuOpen, setMenuOpen] = useState(false);

  // Desktop sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          navigate("/login");
          return;
        }

        if (data.user.role !== "SUPPORT") {
          navigate("/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Support session check error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={`dashboard-shell support-dashboard-shell ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      data-theme={theme}
    >
      <SupportNavbar
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        handleLogout={handleLogout}
      />

      <main className="dashboard-main support-main">
        <Outlet context={{ user }} />
      </main>
    </div>
    
  );
  
}
