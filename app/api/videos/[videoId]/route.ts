import { prisma } from '../../../_lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const id = parseInt(videoId);

    if (isNaN(id)) {
      return Response.json(
        { error: '無効な動画IDです' },
        { status: 400 }
      );
    }

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video) {
      return Response.json(
        { error: '動画が見つかりません' },
        { status: 404 }
      );
    }

    return Response.json(video);
  } catch (error) {
    console.error('Failed to fetch video:', error);
    return Response.json(
      { error: '動画の取得に失敗しました' },
      { status: 500 }
    );
  }
}
