import type { SessionSummary } from "../../types";

interface SessionListProps {
  sessions: SessionSummary[];
  onSelect: (id: number) => void;
}

const personaTitles: Record<string, string> = {
  sr_vp_software: "Senior VP of Software",
  cto: "Chief Technology Officer",
  cio: "Chief Information Officer",
  project_manager: "Project Manager",
};

export default function SessionList({ sessions, onSelect }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No sessions yet</p>
        <p className="text-sm mt-1">
          Start a chat session to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelect(session.id)}
          className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">
                {personaTitles[session.persona] || session.persona}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(session.started_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {session.feedback?.score != null && (
                <span
                  className={`text-sm font-bold px-2 py-1 rounded ${
                    session.feedback.score >= 7
                      ? "bg-green-100 text-green-800"
                      : session.feedback.score >= 4
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {session.feedback.score}/10
                </span>
              )}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  session.status === "completed"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {session.status}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
