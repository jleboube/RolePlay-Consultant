import { useState, useEffect } from "react";
import { adminApi, type ReportCardListResponse } from "../../services/adminApi";
import type { User, SessionFeedback } from "../../types";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "bg-green-100 text-green-800" : score >= 4 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${color}`}>{score}/10</span>;
}

export default function ReportCardsTab() {
  const [data, setData] = useState<ReportCardListResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [filterUser, setFilterUser] = useState<number | undefined>();
  const [filterPersona, setFilterPersona] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getReportCards({ page, per_page: 15, user_id: filterUser, persona: filterPersona || undefined })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterUser, filterPersona]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filterUser ?? ""}
          onChange={(e) => { setFilterUser(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="p-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>

        <select
          value={filterPersona}
          onChange={(e) => { setFilterPersona(e.target.value); setPage(1); }}
          className="p-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Personas</option>
          <option value="sr_vp_software">Sr VP Software</option>
          <option value="cto">CTO</option>
          <option value="cio">CIO</option>
          <option value="project_manager">Project Manager</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No completed sessions found.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Persona</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map(({ session: s, user: u }) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <td className="px-4 py-3">{u?.name ?? "Unknown"}<br /><span className="text-gray-400 text-xs">{u?.email}</span></td>
                    <td className="px-4 py-3 capitalize">{s.persona.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-gray-500">{s.ended_at ? new Date(s.ended_at).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">{s.feedback?.score != null ? <ScoreBadge score={s.feedback.score} /> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded detail */}
          {expandedId && <ReportCardDetail sessionId={expandedId} />}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {data.pages}</span>
              <button
                onClick={() => setPage(Math.min(data.pages, page + 1))}
                disabled={page >= data.pages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportCardDetail({ sessionId }: { sessionId: number }) {
  const [detail, setDetail] = useState<{ session: import("../../types").SessionDetail; user: User | null } | null>(null);

  useEffect(() => {
    adminApi.getReportCard(sessionId).then(setDetail).catch(() => {});
  }, [sessionId]);

  if (!detail) return <div className="text-center py-4 text-gray-500">Loading details...</div>;

  const { session: s, user: u } = detail;
  const fb = s.feedback as SessionFeedback | null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{u?.name} - <span className="capitalize">{s.persona.replace(/_/g, " ")}</span></h3>
          <p className="text-sm text-gray-500">{s.ended_at ? new Date(s.ended_at).toLocaleString() : ""}</p>
        </div>
        {fb?.score != null && <ScoreBadge score={fb.score} />}
      </div>

      {fb && (
        <div className="space-y-3">
          {fb.summary && <p className="text-gray-700">{fb.summary}</p>}

          {fb.strengths?.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 text-sm mb-1">Strengths</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {fb.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {fb.improvements?.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-700 text-sm mb-1">Areas for Improvement</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {fb.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      {s.messages && s.messages.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900">
            View Transcript ({s.messages.length} messages)
          </summary>
          <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
            {s.messages.map((m, i) => (
              <div key={i} className={`text-sm p-2 rounded ${m.role === "user" ? "bg-blue-50" : "bg-gray-50"}`}>
                <span className="font-medium text-xs uppercase text-gray-500">{m.role}</span>
                <p className="mt-0.5 text-gray-700">{m.content}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
