import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignUpForm from "./components/SignUpForm";
import LoginForm from "./components/LoginForm";
import PaymentPortal from "./components/PaymentPortal";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("jwt");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-6 px-4">
        <Routes>
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/payment-portal"
            element={
              <ProtectedRoute>
                <PaymentPortal />
              </ProtectedRoute>
            }
          />
          {/* Redirect default route to signup */}
          <Route path="/" element={<Navigate to="/signup" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
