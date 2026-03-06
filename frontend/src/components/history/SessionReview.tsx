import type { SessionDetail } from "../../types";
import MessageBubble from "../chat/MessageBubble";
import FeedbackPanel from "../chat/FeedbackPanel";
import { useState } from "react";

interface SessionReviewProps {
  session: SessionDetail;
  onBack: () => void;
}

const personaTitles: Record<string, string> = {
  sr_vp_software: "Senior VP of Software",
  cto: "Chief Technology Officer",
  cio: "Chief Information Officer",
  project_manager: "Project Manager",
};

export default function SessionReview({ session, onBack }: SessionReviewProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const personaTitle = personaTitles[session.persona] || session.persona;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{personaTitle}</h2>
            <p className="text-sm text-gray-500">
              {new Date(session.started_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {session.feedback && (
          <button
            onClick={() => setShowFeedback(true)}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium text-sm"
          >
            View Feedback
          </button>
        )}
      </div>

      <div className="bg-gray-100 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
        {session.messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} personaTitle={personaTitle} />
        ))}
        {session.messages.length === 0 && (
          <p className="text-center text-gray-500">No messages in this session.</p>
        )}
      </div>

      {showFeedback && session.feedback && (
        <FeedbackPanel
          feedback={session.feedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
