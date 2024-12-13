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
      return notFound();
    }

    const dbVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!dbVideo) {
      return notFound();
    }

    const video: Video = {
      id: dbVideo.id,
      videoUrl: dbVideo.videoUrl,
      evaluationData: dbVideo.evaluationData as EvaluationData || null, // Explicit type assertion
      analysisDate: dbVideo.analysisDate ? dbVideo.analysisDate.toISOString() : null,
      status: dbVideo.status as VideoStatus,
      createdAt: dbVideo.createdAt,
      updatedAt: dbVideo.updatedAt,
      errorMessage: dbVideo.errorMessage,
    };

    return <VideoDetailClient video={video} />;
  } catch (error) {
    console.error('Error in VideoDetailPage:', error);
    return notFound();
  }
}
