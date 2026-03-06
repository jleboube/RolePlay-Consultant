import type { SessionFeedback } from "../../types";

interface FeedbackPanelProps {
  feedback: SessionFeedback;
  onClose: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-red-100 text-red-800";
  if (score >= 7) color = "bg-green-100 text-green-800";
  else if (score >= 4) color = "bg-yellow-100 text-yellow-800";

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${color}`}>
      {score}/10
    </span>
  );
}

export default function FeedbackPanel({ feedback, onClose }: FeedbackPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Session Feedback
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-6">
            <ScoreBadge score={feedback.score} />
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {feedback.summary}
          </p>

          {feedback.strengths.length > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-1">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-amber-800 mb-2">
                Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-amber-500 mt-1">-</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
