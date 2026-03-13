export interface User {
  id: string;
  username: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningProject {
  id: string;
  userId: string;
  title: string;
  status: "active" | "completed" | "archived";
  currentLessonId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningProfile {
  id: string;
  projectId: string;
  topic: string;
  goal: string;
  currentLevel: "beginner" | "intermediate" | "advanced";
  timeBudget: number;
  learningStyle: "visual" | "practical" | "theoretical" | null;
  preferences: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Material {
  id: string;
  projectId: string;
  filename: string;
  fileType: "txt" | "md" | "pdf";
  filePath: string;
  fileSize: number;
  parseStatus: "pending" | "processing" | "completed" | "failed";
  extractedText: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MaterialChunk {
  id: string;
  materialId: string;
  chunkText: string;
  chunkIndex: number;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface OutlineChapter {
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  orderIndex: number;
}

export interface Outline {
  id: string;
  projectId: string;
  version: number;
  content: OutlineChapter[];
  isActive: boolean;
  createdAt: Date;
}

export interface LessonExample {
  title: string;
  code?: string;
  content?: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  outlineId: string;
  title: string;
  orderIndex: number;
  objective: string[] | null;
  prerequisites: string[];
  content: string | null;
  examples: LessonExample[] | null;
  summary: string | null;
  estimatedMinutes: number | null;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: "multiple_choice" | "fill_blank" | "code_completion" | "short_answer";
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  createdAt: Date;
}

export interface StudyRecord {
  id: string;
  userId: string;
  lessonId: string;
  status: "in_progress" | "completed";
  studyTime: number;
  completedAt: Date | null;
  createdAt: Date;
}

export interface ExerciseAttempt {
  id: string;
  userId: string;
  exerciseId: string;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string | null;
  attemptedAt: Date;
}
