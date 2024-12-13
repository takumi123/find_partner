import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
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
    const contentType = request.headers.get('content-type');
    console.log('Received Content-Type:', contentType);
    console.log('All headers:', Object.fromEntries(request.headers));

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

    const existingVideo = await prisma.video.findFirst({
      where: {
        videoUrl,
      },
    });

    if (existingVideo) {
      return NextResponse.json(existingVideo);
    }

    const video = await prisma.video.create({
      data: {
        videoUrl,
        status: 'pending',
      },
    });

    analyzeVideo(videoUrl)
      .then(async (evaluationData) => {
        await prisma.video.update({
          where: { id: video.id },
          data: {
            evaluationData: JSON.parse(JSON.stringify(evaluationData)) as Prisma.InputJsonValue,
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
