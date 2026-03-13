export type Difficulty = "easy" | "medium" | "hard";

export interface OutlineChapter {
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  orderIndex: number;
}

export interface OutlineWithId {
  id: string;
  projectId: string;
  version: number;
  content: OutlineChapter[];
  isActive: boolean;
  createdAt: Date;
}

export interface GenerateOutlineRequest {
  regenerate?: boolean;
}

export interface GenerateOutlineResponse {
  success: boolean;
  outline?: {
    id: string;
    chapters: OutlineChapter[];
    version: number;
  };
  error?: string;
}

export interface UpdateOutlineRequest {
  chapters: OutlineChapter[];
}

export interface UpdateOutlineResponse {
  success: boolean;
  outline?: OutlineWithId;
  error?: string;
}

export interface GetOutlineResponse {
  success: boolean;
  outline?: OutlineWithId;
  error?: string;
}
