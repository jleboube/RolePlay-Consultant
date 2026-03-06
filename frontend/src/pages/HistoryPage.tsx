import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { SessionSummary, SessionDetail } from "../types";
import SessionList from "../components/history/SessionList";
import SessionReview from "../components/history/SessionReview";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSessions()
      .then(setSessions)
      .catch(() => setError("Failed to load sessions."))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectSession = async (id: number) => {
    try {
      setLoading(true);
      const detail = await api.getSession(id);
      setSelectedSession(detail);
    } catch {
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Session History
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {selectedSession ? (
        <SessionReview
          session={selectedSession}
          onBack={() => setSelectedSession(null)}
        />
      ) : (
        <SessionList sessions={sessions} onSelect={handleSelectSession} />
      )}
    </div>
  );
}
