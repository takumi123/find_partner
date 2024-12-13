import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { analyzeVideo } from "@/app/_lib/gemini";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: '動画の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Content-Typeヘッダーを確認
    const contentType = request.headers.get('content-type');
    console.log('Received Content-Type:', contentType);

    // Content-Typeのデバッグ情報
    console.log('All headers:', Object.fromEntries(request.headers));

    // if (!contentType || contentType !== 'application/json') {
    //   return NextResponse.json(
    //     { error: `Invalid Content-Type: ${contentType}. Expected application/json` },
    //     { status: 400 }
    //   );
    // }

    // リクエストボディを取得
    const formData = await request.formData();
    console.log('FormData received:', formData);

    const videoUrl = formData.get('videoUrl');
    if (typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: '動画URLは必須です' },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: '動画URLは必須です' },
        { status: 400 }
      );
    }

    // 既存の動画を探す
    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl,
      },
    });

    if (existingVideo) {
      return NextResponse.json(existingVideo);
    }

    // 新しい動画を作成
    const video = await prisma.video.create({
      data: {
        videoUrl,
        status: 'pending',
      },
    });

    // 非同期で分析を開始
    analyzeVideo(videoUrl)
      .then(async (evaluationData) => {
        await prisma.video.update({
          where: { id: video.id },
          data: {
            evaluationData,
            analysisDate: new Date(),
            status: 'completed',
          },
        });
      })
      .catch(async (error: Error) => {
        console.error('Error analyzing video:', error);
        await prisma.video.update({
          where: { id: video.id },
          data: {
            status: 'error',
            errorMessage: error.message,
          },
        });
      });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `動画の作成に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: '動画の作成に失敗しました' },
      { status: 500 }
    );
  }
}
