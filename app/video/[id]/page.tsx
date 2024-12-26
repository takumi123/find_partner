import { VideoDetailClient } from './VideoDetailClient';
import { prisma } from '../../_lib/prisma';
import { notFound } from 'next/navigation';
import { Video, VideoStatus, EvaluationData } from '../../_types/video';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: PageProps) {
  try {
    // Wait for params
    const { id: videoId } = await params;
    const id = Number(videoId);

    if (isNaN(id)) {
      console.error('Invalid ID format:', videoId);
      return notFound();
    }

    const dbVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!dbVideo) {
      console.error('Video not found:', id);
      return notFound();
    }

    console.log('Database video:', dbVideo);

    const video: Video = {
      id: dbVideo.id,
      videoUrl: dbVideo.videoUrl,
      youtubeUrl: dbVideo.youtubeUrl,
      evaluationData: dbVideo.evaluationData ? (dbVideo.evaluationData as unknown as EvaluationData) : null,
      analysisDate: dbVideo.analysisDate ? dbVideo.analysisDate.toISOString() : null,
      status: dbVideo.status as VideoStatus,
      createdAt: dbVideo.createdAt,
      updatedAt: dbVideo.updatedAt,
      errorMessage: dbVideo.errorMessage,
    };

    console.log('Processed video:', video);

    return <VideoDetailClient video={video} />;
  } catch (error) {
    console.error('Error in VideoDetailPage:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw error; // Next.jsのエラーページを表示
  }
}
