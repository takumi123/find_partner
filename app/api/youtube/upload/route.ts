import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { Readable } from 'stream';
import { prisma } from '../../../_lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { url, title, description } = await req.json();

    // アカウント情報を取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account || !account.access_token) {
      throw new Error('Googleアカウントが連携されていません');
    }

    // ファイルを取得
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const readable = Readable.from(buffer);

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

    // YouTubeにアップロード
    const youtubeResponse = await youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: description || '動画の説明'
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

    return NextResponse.json({
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeResponse.data.id}`
    });
  } catch (error) {
    console.error('YouTube upload error:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
