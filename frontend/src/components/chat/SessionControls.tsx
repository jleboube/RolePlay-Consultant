interface SessionControlsProps {
  isListening: boolean;
  isSpeechSupported: boolean;
  onToggleMic: () => void;
  onEndSession: () => void;
  sessionActive: boolean;
}

export default function SessionControls({
  isListening,
  isSpeechSupported,
  onToggleMic,
  onEndSession,
  sessionActive,
}: SessionControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {isSpeechSupported && (
        <button
          onClick={onToggleMic}
          disabled={!sessionActive}
          className={`p-3 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {isListening ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            )}
          </svg>
        </button>
      )}

      {sessionActive && (
        <button
          onClick={onEndSession}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
        >
          End Session
        </button>
      )}
    </div>
  );
}
