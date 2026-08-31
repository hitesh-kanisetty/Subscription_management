import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CustomerNavbar from "./CustomerNavbar";

export default function CustomerLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          navigate("/login");
          return;
        }

        if (data.user.role !== "CUSTOMER") {
          navigate("/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Session check error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
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
    return (
      <div className="customer-loading">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="customer-dashboard-shell">
      <CustomerNavbar
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        handleLogout={handleLogout}
      />

      <main className="customer-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}