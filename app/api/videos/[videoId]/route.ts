import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/prisma';
import { auth } from '../../../auth';
import { analyzeVideo } from '../../../_lib/gemini';
import { Prisma } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { status, startAnalysis } = await req.json();
    
    if (!params?.videoId) {
      return NextResponse.json({ error: 'ビデオIDが必要です' }, { status: 400 });
    }

    const videoId = parseInt(params.videoId);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: '無効なビデオIDです' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: 'ビデオが見つかりません' }, { status: 404 });
    }

    if (video.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    if (startAnalysis && video.youtubeUrl) {
      try {
        // 分析ステータスを更新
        await prisma.video.update({
          where: { id: videoId },
          data: { status: 'analyzing' },
        });

        // 動画の処理が完了するまで待機
        console.log('分析開始前の待機を開始します...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒待機

        // Geminiによる分析を実行
        console.log('動画分析を開始します:', video.youtubeUrl);
        const analysisResult = await analyzeVideo(video.youtubeUrl) as unknown as Prisma.InputJsonValue;
        console.log('分析結果:', JSON.stringify(analysisResult, null, 2));

        // 分析結果を保存
        const updatedVideo = await prisma.video.update({
          where: { id: videoId },
          data: {
            evaluationData: analysisResult,
            status: 'completed',
            analysisDate: new Date(),
          },
        });

        return NextResponse.json(updatedVideo);
      } catch (error) {
        console.error('Analysis error:', error);
        
        // エラー時のステータス更新
        const updatedVideo = await prisma.video.update({
          where: { id: videoId },
          data: {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : '分析中にエラーが発生しました',
          },
        });

        return NextResponse.json(updatedVideo);
      }
    }

    // 通常のステータス更新
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: { status },
    });

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error('Video update error:', error);
    return NextResponse.json(
      { error: 'ビデオの更新に失敗しました' },
      { status: 500 }
    );
  }
}
