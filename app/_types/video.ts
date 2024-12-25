export type VideoStatus = 'pending' | 'analyzing' | 'completed' | 'error' | 'uploading_youtube';

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
  youtubeUrl?: string | null;
  youtubeTitle?: string | null;
  youtubeDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
