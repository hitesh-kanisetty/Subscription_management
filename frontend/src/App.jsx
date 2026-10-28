import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/landing/Navbar";
import CTA from "./components/landing/CTA";
import Features from "./components/landing/Features";
import Footer from "./components/landing/Footer";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";

import Login from "./pages/login/login";
import Signup from "./pages/signup/signup";
import ForgotPassword from "./pages/login/ForgetPassword";
import VerifyOtp from "./pages/login/VerifyOtp";
import ResetPassword from "./pages/login/ResetPassword";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/admin_dash";
import AdminPlans from "./pages/admin/admin_plans";
import AdminCreatePlan from "./pages/admin/adminCreatePlan";
import AdminManagePlan from "./pages/admin/AdminManagePlan";
import AdminEditPlan from "./pages/admin/AdminEditPlan";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetails from "./pages/admin/AdminCustomerDetails";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSupportDetails from "./pages/admin/AdminSupportDetails";
import AdminProfile from "./pages/admin/Profile";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminRenewals from "./pages/admin/AdminRenewals";
import AdminSupportAgents from "./pages/admin/AdminSupportAgents";
import AdminFinancialAnalytics from "./pages/admin/FinancialAnalytics";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminCoupons from "./pages/admin/AdminCoupons";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerLayout from "./components/customer/CustomerLayout";
import CustomerPlans from "./pages/customer/CustomerPlans";
import CustomerPlanDetails from "./pages/customer/CustomerPlanDetails";
import CustomerSubscription from "./pages/customer/CustomerSubscription";
import Billing from "./pages/customer/Billing";
import Renewals from "./pages/customer/Renewals";
import Support from "./pages/customer/support";
import CreateSupport from "./pages/customer/CreateSupport";
import SupportDetails from "./pages/customer/SupportDetails";
import Profile from "./pages/customer/Profile";

import SupportLayout from "./components/support/SupportLayout";
import SupportDashboard from "./pages/support/SupportDashboard";
import SupportMyTickets from "./pages/support/SupportMyTickets";
import SupportTicketDetail from "./pages/support/SupportTicketDetail";
import SupportProfile from "./pages/support/SupportProfile";
import SupportRefunds from "./pages/support/SupportRefunds";
import SupportRefundDetail from "./pages/support/SupportRefundDetail";
import SupportAgentBilling from "./pages/support/SupportAgentBilling";
import SupportAgentCustomers from "./pages/support/SupportAgentCustomers";
import SupportAgentCustomerDetails from "./pages/support/SupportAgentCustomerDetails";
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route
            path="financial-analytics"
            element={<AdminFinancialAnalytics />}
          />

          <Route path="plans/create" element={<AdminCreatePlan />} />

          <Route path="plans/:id/edit" element={<AdminEditPlan />} />

          <Route path="plans/:id" element={<AdminManagePlan />} />

          <Route path="customers" element={<AdminCustomers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="support-agents" element={<AdminSupportAgents />} />
          <Route path="customers/:id" element={<AdminCustomerDetails />} />
          <Route path="billings" element={<AdminBilling />} />
          <Route path="renewals" element={<AdminRenewals />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="support/:id" element={<AdminSupportDetails />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>

        <Route path="/support" element={<SupportLayout />}>
          <Route index element={<SupportDashboard />} />
          <Route path="tickets" element={<SupportMyTickets />} />
          <Route path="tickets/:id" element={<SupportTicketDetail />} />
          <Route path="customers" element={<SupportAgentCustomers />} />
          <Route path="billings" element={<SupportAgentBilling />} />
          <Route path="customers/:id" element={<SupportAgentCustomerDetails />} />

          <Route path="refunds" element={<SupportRefunds />} />
          <Route path="refunds/:id" element={<SupportRefundDetail />} />
          <Route path="profile" element={<SupportProfile />} />
        </Route>

        <Route path="/user" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />

          <Route path="plans" element={<CustomerPlans />} />

          <Route path="plans/:id" element={<CustomerPlanDetails />} />

          <Route path="subscription" element={<CustomerSubscription />} />
          <Route path="renewals" element={<Renewals />} />
          <Route path="support" element={<Support />} />
          <Route path="billing" element={<Billing />} />
          <Route path="support/create" element={<CreateSupport />} />
          <Route path="support/:id" element={<SupportDetails />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
