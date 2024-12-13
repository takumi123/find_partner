import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'ファイル名が必要です' }, { status: 400 });
  }

  const body = request.body;
  if (!body) {
    return NextResponse.json({ error: 'ファイルデータが必要です' }, { status: 400 });
  }

  try {
    const blob = await put(filename, body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error.message}` },
      { status: 500 }
    );
  }
}
