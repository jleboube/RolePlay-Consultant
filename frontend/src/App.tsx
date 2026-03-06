import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/common/Navbar";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingSpinner from "./components/common/LoadingSpinner";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";

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
      <Navbar user={user} onLogout={logout} />
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
      </Routes>
    </ErrorBoundary>
  );
}
