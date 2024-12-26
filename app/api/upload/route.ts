import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '../../auth';

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

    // Vercel Blobにアップロード
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true // ファイル名の重複を避けるためにランダムなサフィックスを追加
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
