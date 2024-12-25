import { NextResponse } from 'next/server';
import { prisma } from '../../_lib/prisma';
import { auth } from '../../auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id,
        status: 'completed'
      },
      select: {
        id: true,
        videoUrl: true,
        evaluationData: true,
        analysisDate: true,
        status: true,
        youtubeUrl: true,
        youtubeTitle: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Analyses fetch error:', error);
    return NextResponse.json(
      { error: '分析結果の取得に失敗しました' },
      { status: 500 }
    );
  }
}
