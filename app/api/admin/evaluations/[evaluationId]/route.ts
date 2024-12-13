import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const { item, point3, point2, point1 } = await request.json();
    const evaluationId = parseInt(params.evaluationId);

    if (!item || !point3 || !point2 || !point1) {
      return NextResponse.json(
        { error: '全ての項目は必須です' },
        { status: 400 }
      );
    }

    const updatedEvaluation = await prisma.evaluationItem.update({
      where: { id: evaluationId },
      data: {
        item,
        point3,
        point2,
        point1,
      },
    });

    return NextResponse.json(updatedEvaluation);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return NextResponse.json(
      { error: '評価項目の更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const evaluationId = parseInt(params.evaluationId);

    await prisma.evaluationItem.delete({
      where: { id: evaluationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return NextResponse.json(
      { error: '評価項目の削除に失敗しました' },
      { status: 500 }
    );
  }
}