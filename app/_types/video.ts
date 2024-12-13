export type VideoStatus = 'pending' | 'analyzing' | 'completed' | 'error';

// Type for evaluation data structure
import { AnalysisData } from '../_lib/gemini';

export type EvaluationData = AnalysisData;

export interface Video {
  id: number;
  videoUrl: string | null;
  evaluationData: EvaluationData | null;
  analysisDate: string | null;
  status: VideoStatus;
  error?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
