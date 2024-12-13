import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  const { evaluationId } = await params;
  try {
    const { item, point3, point2, point1 } = await request.json();

    if (!item || !point3 || !point2 || !point1) {
      return NextResponse.json(
        { error: '全ての項目は必須です' },
        { status: 400 }
      );
    }

    const updatedEvaluation = await prisma.evaluationItem.update({
      where: { id: parseInt(evaluationId) },
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
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;

    await prisma.evaluationItem.delete({
      where: { id: parseInt(evaluationId) },
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