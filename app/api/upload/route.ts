import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '../../auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const filename = req.nextUrl.searchParams.get('filename');
    if (!filename) {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      );
    }

    // リクエストボディから直接ファイルを取得
    const file = await req.blob();
    
    // Vercel Blobにアップロード
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error instanceof Error ? error.message : '不明なエラー');
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
