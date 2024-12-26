import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../_lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのGoogleアカウント情報を取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Googleアカウントが連携されていません' }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: account.access_token,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    return NextResponse.json({ error: 'トークンの取得に失敗しました' }, { status: 500 });
  }
}
