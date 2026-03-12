import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import ReportCardsTab from "../components/admin/ReportCardsTab";
import MicrosoftConfigTab from "../components/admin/MicrosoftConfigTab";
import OneDriveTab from "../components/admin/OneDriveTab";
import PersonasTab from "../components/admin/PersonasTab";
import LoadingSpinner from "../components/common/LoadingSpinner";

type Tab = "report-cards" | "personas" | "microsoft" | "onedrive";

export default function AdminPage() {
  const { authenticated, loading, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("report-cards");
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;

  if (!authenticated) {
    navigate("/admin/login", { replace: true });
    return null;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "report-cards", label: "Report Cards" },
    { id: "personas", label: "Personas" },
    { id: "microsoft", label: "Microsoft Auth" },
    { id: "onedrive", label: "OneDrive" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Admin Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "report-cards" && <ReportCardsTab />}
        {activeTab === "personas" && <PersonasTab />}
        {activeTab === "microsoft" && <MicrosoftConfigTab />}
        {activeTab === "onedrive" && <OneDriveTab />}
      </div>
    </div>
  );
}
