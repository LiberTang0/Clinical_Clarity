/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Schedule from "./pages/Schedule";
import History from "./pages/History";
import Recording from "./pages/Recording";
import SOAPReview from "./pages/SOAPReview";
import CodingSignOff from "./pages/CodingSignOff";
import OrdersReferrals from "./pages/OrdersReferrals";
import VisitFinalization from "./pages/VisitFinalization";
import Login from "./pages/Login";

export function AppRoutes() {
  const { user } = useAuth();

  // When doctor is not logged in, display the Login screen as the first screen
  if (!user) {
    return <Login />;
  }

  // Once the doctor is logged in, display the actual home: Today's Schedule and clinical navigation
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Schedule />} />
        <Route path="visit/active" element={<Recording />} />
        <Route path="visit/review" element={<SOAPReview />} />
        <Route path="visit/coding" element={<CodingSignOff />} />
        <Route path="visit/orders" element={<OrdersReferrals />} />
        <Route path="visit/finalization" element={<VisitFinalization />} />
        <Route path="history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
