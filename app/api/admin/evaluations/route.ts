import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';

export async function GET() {
  try {
    const evaluations = await prisma.evaluationItem.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: '評価項目の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { item, point3, point2, point1 } = await request.json();

    if (!item || !point3 || !point2 || !point1) {
      return NextResponse.json(
        { error: '全ての項目は必須です' },
        { status: 400 }
      );
    }

    const newEvaluation = await prisma.evaluationItem.create({
      data: {
        item,
        point3,
        point2,
        point1,
      },
    });

    return NextResponse.json(newEvaluation);
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      { error: '評価項目の作成に失敗しました' },
      { status: 500 }
    );
  }
}
