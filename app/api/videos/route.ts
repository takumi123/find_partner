import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../_lib/prisma';
import { auth } from '../../auth';
import { put } from '@vercel/blob';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { analyzeVideo } from '../../_lib/gemini';
import { Prisma } from '@prisma/client';

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
  console.log('動画アップロード開始');
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

    console.log('Vercel Blobにアップロード中...');
    // Vercel Blobにアップロード
    const blob = await put(file.name, file, {
      access: 'public',
    });

    console.log('データベースに記録中...');
    // データベースに記録
    const video = await prisma.video.create({
      data: {
        videoUrl: blob.url,
        status: 'uploading',
        user: {
          connect: {
            id: session.user.id
          }
        }
      }
    });

    // YouTubeへのアップロードを開始
    console.log('YouTubeアップロード開始...');
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account || !account.access_token) {
      throw new Error('Googleアカウントが連携されていません');
    }

    // YouTubeクライアントの初期化
    const youtube = google.youtube('v3');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token
    });

    // トークンの更新処理
    if (!account.refresh_token) {
      throw new Error('アクセス権限の更新が必要です。一度ログアウトして、再度ログインしてください。');
    }

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      // データベースのアクセストークンを更新
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: account.providerAccountId
          }
        },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined
        }
      });
    } catch (error) {
      console.error('トークン更新エラー:', error);
      throw new Error('アクセストークンの更新に失敗しました。再度ログインしてください。');
    }

    // Blobからファイルを取得してYouTubeにアップロード
    const response = await fetch(blob.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const readable = Readable.from(buffer);

    const youtubeResponse = await youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: file.name,
          description: '動画の説明'
        },
        status: {
          privacyStatus: 'unlisted'
        }
      },
      media: {
        body: readable
      }
    });

    if (!youtubeResponse.data.id) {
      throw new Error('YouTubeへのアップロードに失敗しました');
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeResponse.data.id}`;

    // Vercel Blobから削除
    // TODO: Blobの削除APIが利用可能になったら実装

    // Vercel Blobから削除
    try {
      const blobResponse = await fetch(blob.url);
      if (!blobResponse.ok) {
        console.error('Blob削除エラー: ファイルが見つかりません');
      }
      // TODO: Blobの削除APIが利用可能になったら実装
    } catch (error) {
      console.error('Blob削除エラー:', error);
    }

    // 分析を開始
    try {
      console.log('動画分析を開始します:', youtubeUrl);
      const analysisResult = await analyzeVideo(youtubeUrl) as unknown as Prisma.InputJsonValue;
      
      const updatedVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          youtubeUrl,
          status: 'completed',
          evaluationData: analysisResult,
          analysisDate: new Date()
        }
      });

      return NextResponse.json(updatedVideo);
    } catch (error) {
      console.error('Analysis error:', error);
      
      const errorVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          youtubeUrl,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : '分析中にエラーが発生しました'
        }
      });

      return NextResponse.json(errorVideo);
    }
  } catch (error) {
    console.error('Video creation error:', error instanceof Error ? error.message : '不明なエラー');
    return NextResponse.json({ error: '動画の作成に失敗しました' }, { status: 500 });
  }
}
