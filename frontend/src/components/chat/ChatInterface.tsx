import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";
import { api } from "../../services/api";
import type { Persona, ChatMessage, SessionFeedback } from "../../types";
import PersonaSelector from "./PersonaSelector";
import VoiceSelector from "./VoiceSelector";
import MessageBubble from "./MessageBubble";
import SessionControls from "./SessionControls";
import FeedbackPanel from "./FeedbackPanel";

export default function ChatInterface() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { emit, on, off } = useSocket();
  const { voices, speak, stop: stopSpeaking } = useSpeechSynthesis();

  const handleSpeechResult = useCallback(
    (transcript: string) => {
      if (sessionId && transcript.trim()) {
        const msg: ChatMessage = { role: "user", content: transcript.trim() };
        setMessages((prev) => [...prev, msg]);
        emit("send_message", { session_id: sessionId, content: transcript.trim() });
        setIsLoading(true);
      }
    },
    [sessionId, emit],
  );

  const {
    transcript,
    isListening,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition(handleSpeechResult);

  // Load personas
  useEffect(() => {
    api.getPersonas().then(setPersonas).catch(() => setError("Failed to load personas."));
  }, []);

  // Socket event listeners
  useEffect(() => {
    const handleSessionStarted = (data: { session_id: number; greeting: string }) => {
      setSessionId(data.session_id);
      setMessages([{ role: "assistant", content: data.greeting }]);
      setIsLoading(false);
      speak(data.greeting, selectedVoice);
    };

    const handleAiResponse = (data: { session_id: number; content: string }) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      setIsLoading(false);
      speak(data.content, selectedVoice);
    };

    const handleSessionEnded = (data: { session_id: number; feedback: SessionFeedback }) => {
      setFeedback(data.feedback);
      setIsLoading(false);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    };

    on("session_started", handleSessionStarted as (...args: unknown[]) => void);
    on("ai_response", handleAiResponse as (...args: unknown[]) => void);
    on("session_ended", handleSessionEnded as (...args: unknown[]) => void);
    on("error", handleError as (...args: unknown[]) => void);

    return () => {
      off("session_started");
      off("ai_response");
      off("session_ended");
      off("error");
    };
  }, [on, off, speak, selectedVoice]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartSession = () => {
    if (!selectedPersona) return;
    setMessages([]);
    setFeedback(null);
    setError(null);
    setIsLoading(true);
    emit("start_session", { persona: selectedPersona });
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !sessionId) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    emit("send_message", { session_id: sessionId, content: text });
    setInputText("");
    setIsLoading(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = () => {
    if (!sessionId) return;
    stopSpeaking();
    stopListening();
    setIsLoading(true);
    emit("end_session", { session_id: sessionId });
  };

  const handleCloseFeedback = () => {
    setFeedback(null);
    setSessionId(null);
    setSelectedPersona(null);
  };

  const currentPersona = personas.find((p) => p.name === selectedPersona);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-6 overflow-y-auto">
        <PersonaSelector
          personas={personas}
          selectedPersona={selectedPersona}
          onSelect={setSelectedPersona}
          disabled={!!sessionId}
        />

        <VoiceSelector
          voices={voices}
          selectedVoice={selectedVoice}
          onSelect={setSelectedVoice}
          disabled={!!sessionId}
        />

        {!sessionId && selectedPersona && (
          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Start Session"}
          </button>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {messages.length === 0 && !sessionId && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Select a persona to begin</p>
                <p className="text-sm mt-1">Choose an executive persona from the sidebar to start your practice session</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              personaTitle={currentPersona?.title}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}

          {isListening && transcript && (
            <div className="flex justify-end mb-4">
              <div className="bg-primary-100 text-primary-700 rounded-2xl px-5 py-3 italic">
                {transcript}...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {(error || speechError) && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-700">{error || speechError}</p>
          </div>
        )}

        {/* Input Area */}
        {sessionId && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-3">
              <SessionControls
                isListening={isListening}
                isSpeechSupported={isSpeechSupported}
                onToggleMic={isListening ? stopListening : startListening}
                onEndSession={handleEndSession}
                sessionActive={!!sessionId}
              />

              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message or use the microphone..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={1}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedback && (
        <FeedbackPanel feedback={feedback} onClose={handleCloseFeedback} />
      )}
    </div>
  );
}
