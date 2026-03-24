import { Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";

import Login from "./login";
import Home from "./home";
import Register from "./register";

import UserSettings from "./pages/userpages/UserSettings"
import UserQueue from "./pages/userpages/UserQueue";
import UserMessage from "./pages/userpages/UserMessage";
import UserProfile from "./pages/userpages/UserProfile";
import UserFeed from "./pages/userpages/UserFeed";

import NotFound from './NotFound'
import EmployerMessage from "./pages/employerpages/EmployerMessage";
import LaborFinder from "./pages/employerpages/LaborFinder";
import EmployerFeed from "./pages/employerpages/EmployerFeed";
import EmployerSettings from "./pages/employerpages/EmployerSettings"
import TopUp from "./pages/hybridpages/UserTopUp";
import PaymentSuccess from "./pages/paymentpages/PaymentSuccess";
import PaymentCancel from "./pages/paymentpages/PaymentCancel";

import UserManagement from "./pages/adminpages/UserManagement";
import AdminTokenManagement from "./pages/adminpages/AdminTokenManagement";
import Wallet from "./pages/hybridpages/Wallet";
import MyWorkers from "./pages/employerpages/MyWorkers";

function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────── */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PayMongo redirects here — must be public (no auth header on redirect) */}
      <Route path="/success/payment" element={<PaymentSuccess />} />
      <Route path="/cancel/payment"  element={<PaymentCancel />} />

      {/* ── User only ──────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["user"]} />}>
        <Route path="/user/settings"   element={<UserSettings />} />
        <Route path="/user/queue"      element={<UserQueue />} />
        <Route path="/user/feeds"      element={<UserFeed />} />
        <Route path="/user/myprofile"  element={<UserProfile />} />
        <Route path="/user/message"    element={<UserMessage />} />
        <Route path="/user/topup"      element={<TopUp />} />
        <Route path="/user/wallet"      element={<Wallet />} />
      </Route>

      {/* ── Employer only ──────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["employer"]} />}>
        <Route path="/employer/feeds"    element={<EmployerFeed />} />
        <Route path="/employer/find"     element={<LaborFinder />} />
        <Route path="/employer/labor"     element={<MyWorkers />} />
        <Route path="/employer/message"  element={<EmployerMessage />} />
        <Route path="/employer/settings" element={<EmployerSettings />} />
        <Route path="/employer/topup"    element={<TopUp />} />
        <Route path="/employer/wallet"      element={<Wallet />} />
      </Route>

      {/* ── Admin only ─────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["admin"]} />}>
        <Route path="/admin/usermanagement" element={<UserManagement />} />
        <Route path="/admin/tokens" element={<AdminTokenManagement />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;