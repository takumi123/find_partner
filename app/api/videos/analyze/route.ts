import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/prisma';
import { auth } from '../../../auth';
import { analyzeVideo } from '../../../_lib/gemini';
import { Prisma } from '@prisma/client';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { youtubeUrl, title } = await req.json();

    // 新しいビデオレコードを作成
    const video = await prisma.video.create({
      data: {
        videoUrl: '', // 空文字列を設定
        youtubeUrl,
        youtubeTitle: title,
        status: 'analyzing',
        userId: session.user.id,
      }
    });

    try {
      console.log('動画分析を開始します:', youtubeUrl);
      const analysisResult = await analyzeVideo(youtubeUrl) as unknown as Prisma.InputJsonValue;
      console.log('分析結果:', JSON.stringify(analysisResult, null, 2));
      
      // 分析結果を保存
      await prisma.video.update({
        where: { id: video.id },
        data: {
          evaluationData: analysisResult,
          status: 'completed',
          analysisDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        status: 'completed'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      
      // エラー時のステータス更新
      await prisma.video.update({
        where: { id: video.id },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : '分析中にエラーが発生しました',
        },
      });

      return NextResponse.json({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : '分析中にエラーが発生しました'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: '分析の開始に失敗しました' 
    }, { status: 500 });
  }
}
