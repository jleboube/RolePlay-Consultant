export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  preferences: Record<string, string>;
}

export interface AuthState {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface Persona {
  name: string;
  title: string;
  traits: string[];
  description: string;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface SessionSummary {
  id: number;
  persona: string;
  started_at: string;
  ended_at: string | null;
  feedback: SessionFeedback | null;
  status: string;
}

export interface SessionDetail extends SessionSummary {
  messages: ChatMessage[];
}

export interface SessionFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  highlights: { quote?: string; commentary?: string }[];
  summary: string;
}
