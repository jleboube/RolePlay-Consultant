import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/common/Navbar";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Footer from "./components/common/Footer";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!authenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/chat" replace /> : <LandingPage />}
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
