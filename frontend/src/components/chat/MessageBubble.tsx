import type { ChatMessage } from "../../types";

interface MessageBubbleProps {
  message: ChatMessage;
  personaTitle?: string;
}

export default function MessageBubble({
  message,
  personaTitle,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] ${
          isUser
            ? "bg-primary-600 text-white rounded-2xl rounded-br-md"
            : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm"
        } px-5 py-3`}
      >
        {!isUser && personaTitle && (
          <p className="text-xs font-semibold text-primary-600 mb-1">
            {personaTitle}
          </p>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.timestamp && (
          <p
            className={`text-xs mt-1 ${isUser ? "text-primary-200" : "text-gray-400"}`}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
