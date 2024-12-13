export type VideoStatus = 'pending' | 'analyzing' | 'completed' | 'error';

// Updated EvaluationData type to accept a string
export type EvaluationData = string | null;

export interface Video {
  id: number;
  videoUrl: string | null;
  evaluationData: EvaluationData; // This will now accept a string or null
  analysisDate: string | null;
  status: VideoStatus;
  error?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
