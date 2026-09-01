import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/landing/Navbar";
import CTA from "./components/landing/CTA";
import Features from "./components/landing/Features";
import Footer from "./components/landing/Footer";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";

import Login from "./pages/login/login";
import Signup from "./pages/signup/signup";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/admin_dash";
import AdminPlans from "./pages/admin/admin_plans";
import AdminCreatePlan from "./pages/admin/adminCreatePlan";
import AdminManagePlan from "./pages/admin/AdminManagePlan";
import AdminEditPlan from "./pages/admin/AdminEditPlan";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerLayout from "./components/customer/CustomerLayout";
import CustomerPlans from "./pages/customer/CustomerPlans";

function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>

      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="plans/create" element={<AdminCreatePlan />} />
           <Route
    path="plans/:id/edit"
    element={<AdminEditPlan />}
  />
          <Route path="plans/:id" element={<AdminManagePlan />} />
        </Route>

        {/* Customer */}
        <Route path="/user" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />

          <Route path="plans" element={<CustomerPlans />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
