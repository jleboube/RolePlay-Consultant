import { Link } from "react-router-dom";
import type { User } from "../../types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              RolePlay AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Chat
                </Link>
                <Link
                  to="/history"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  History
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">{user.name}</span>
                  <button
                    onClick={onLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <a
                href="/api/auth/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
