import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/prisma';
import { auth } from '../../../auth';
import { analyzeVideo } from '../../../_lib/gemini';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import { GaxiosPromise, GaxiosResponse } from 'gaxios';
import { youtube_v3 } from 'googleapis';

export const runtime = 'nodejs';

interface YoutubeError {
  code?: number;
  message?: string;
}

type YoutubeInsertResponse = GaxiosResponse<youtube_v3.Schema$Video>;

// リトライ設定
const MAX_RETRIES = 10;
const RETRIABLE_STATUS_CODES = [500, 502, 503, 504];

const youtube = google.youtube('v3');

async function resumableUpload(insertRequest: GaxiosPromise<youtube_v3.Schema$Video>): Promise<YoutubeInsertResponse> {
  let retry = 0;

  while (true) {
    try {
      console.log("動画をアップロード中...");
      const response = await insertRequest;
      
      if (!response?.data?.id) {
        throw new Error(`予期しない応答でアップロードに失敗しました: ${JSON.stringify(response)}`);
      }

      console.log(`動画ID '${response.data.id}' が正常にアップロードされました。`);
      return response;
    } catch (e) {
      const err = e as YoutubeError;
      console.error('YouTube API エラー詳細:', err);
      
      if (err.code && RETRIABLE_STATUS_CODES.includes(err.code)) {
        retry++;
        if (retry > MAX_RETRIES) {
          throw new Error('リトライ回数の上限に達しました。');
        }

        const sleepTime = Math.pow(2, retry) * 1000 + Math.random() * 1000;
        console.log(`リトライ可能なエラーが発生しました。${sleepTime}ミリ秒待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        continue;
      }
      
      if (err.message?.includes('quota')) {
        throw new Error('YouTube APIのクォータを超過しました。後でもう一度お試しください。');
      }

      if (err.message?.includes('Invalid Credentials')) {
        throw new Error('認証情報が無効です。再度ログインしてください。');
      }

      if (err.message?.includes('insufficient permissions')) {
        throw new Error('YouTube APIへのアクセス権限が不足しています。再度ログインして必要な権限を許可してください。');
      }
      
      throw new Error(err.message || 'アップロード中に不明なエラーが発生しました');
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { videoId, title, description } = await req.json();

    // データベースからビデオ情報を取得
    const video = await prisma.video.findUnique({
      where: { id: parseInt(videoId) },
      include: {
        user: {
          include: {
            accounts: true
          }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'ビデオが見つかりません' }, { status: 404 });
    }

    // ユーザーのアクセストークンを取得
    const account = video.user.accounts.find((acc: { provider: string }) => acc.provider === 'google');
    if (!account) {
      return NextResponse.json({ error: 'Googleアカウントが連携されていません' }, { status: 400 });
    }

    console.log('認証情報:', {
      clientId: process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      accessToken: account.access_token,
      hasRefreshToken: !!account.refresh_token
    });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth設定が見つかりません');
      return NextResponse.json({ error: 'サーバーの設定が不完全です' }, { status: 500 });
    }

    const redirectUri = new URL('/api/auth/callback/google', process.env.NEXTAUTH_URL).toString();
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    if (!account.access_token) {
      console.error('アクセストークンが見つかりません');
      return NextResponse.json({ error: '認証情報が不足しています。再度ログインしてください。' }, { status: 401 });
    }

    // アクセストークンとリフレッシュトークンの設定
    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
      ].join(' ')
    });

    // トークンの更新処理
    if (!account.refresh_token) {
      console.error('リフレッシュトークンがありません');
      return NextResponse.json({ 
        error: 'アクセス権限の更新が必要です。一度ログアウトして、再度ログインしてください。'
      }, { status: 401 });
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
      return NextResponse.json({ 
        error: 'アクセストークンの更新に失敗しました。再度ログインしてください。'
      }, { status: 401 });
    }

    // 更新されたアクセストークンの有効性をチェック
    try {
      await youtube.channels.list({
        auth: oauth2Client,
        part: ['snippet'],
        mine: true
      });
    } catch (error) {
      console.error('アクセストークンの検証エラー:', error);
      return NextResponse.json({ 
        error: 'アクセストークンが無効です。再度ログインしてください。'
      }, { status: 401 });
    }

    // 一時ファイルをYouTubeにアップロード
    const fileStream = fs.createReadStream(video.videoUrl);
    const stats = fs.statSync(video.videoUrl);
    
    const insertRequest = youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: description,
        },
        status: {
          privacyStatus: 'unlisted'
        }
      },
      media: {
        body: fileStream,
      }
    }, {
      // アップロードのオプション
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / stats.size) * 100;
        console.log(`アップロード進捗: ${Math.min(Math.round(progress), 100)}%`);
      }
    });

    const response = await resumableUpload(insertRequest);

    // アップロードが成功したらデータベースを更新
    if (response?.data?.id) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${response.data.id}`;
      
      try {
        // 一時ファイルを削除
        await fs.promises.unlink(video.videoUrl);
        console.log('一時ファイルを削除しました:', video.videoUrl);
      } catch (error) {
        console.error('一時ファイルの削除に失敗しました:', error);
      }

      // YouTubeのURLを更新
      await prisma.video.update({
        where: { id: video.id },
        data: {
          videoUrl: '', // 元のファイルパスをクリア
          youtubeUrl: youtubeUrl,
          youtubeTitle: title,
          youtubeDescription: description,
          status: 'analyzing'
        }
      });

      // 動画の処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒待機

      // 分析を開始
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
          youtubeUrl: youtubeUrl,
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
          success: true,
          youtubeUrl: youtubeUrl,
          status: 'error'
        });
      }
    }

    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  } catch (error) {
    console.error('YouTube upload error:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
