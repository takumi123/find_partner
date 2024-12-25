import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../_lib/prisma';
import { auth } from '../../auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Videos fetch error:', error instanceof Error ? error.message : '不明なエラー');
    return NextResponse.json({ error: '動画の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    // ファイルをバッファに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 一時ディレクトリにファイルを保存
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const tempDir = path.join(process.cwd(), 'tmp');
    
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, filename);
    await fs.writeFile(tempFilePath, buffer);

    const video = await prisma.video.create({
      data: {
        videoUrl: tempFilePath,
        status: 'pending',
        user: {
          connect: {
            id: session.user.id
          }
        }
      }
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Video creation error:', error instanceof Error ? error.message : '不明なエラー');
    return NextResponse.json({ error: '動画の作成に失敗しました' }, { status: 500 });
  }
}
