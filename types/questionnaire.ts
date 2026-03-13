export type MessageRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
}

export interface QuestionnaireState {
  messages: ChatMessage[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isComplete: boolean;
  isLoading: boolean;
}

export interface QuestionDefinition {
  id: string;
  question: string;
  type: "single_choice" | "text" | "multi_choice";
  options?: QuestionOption[];
  followUp?: Record<string, string>;
}

export interface LearningProfileDraft {
  topic: string;
  goal: string;
  currentLevel: "beginner" | "intermediate" | "advanced";
  timeBudget: number;
  learningStyle: "visual" | "practical" | "theoretical" | "mixed";
  background: string;
  preferences: string[];
}

export interface GenerateProfileResponse {
  success: boolean;
  profile?: LearningProfileDraft;
  error?: string;
}

export interface StartQuestionnaireResponse {
  success: boolean;
  firstQuestion?: ChatMessage;
  error?: string;
}

export interface AnswerRequest {
  questionId: string;
  answer: string;
  conversationHistory: ChatMessage[];
}

export interface AnswerResponse {
  success: boolean;
  nextQuestion?: ChatMessage;
  isComplete?: boolean;
  error?: string;
}
