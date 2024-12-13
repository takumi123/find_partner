/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // 評価項目の初期データ
  const evaluationItems = [
    {
      item: '相手の話への傾聴と反応',
      point3: '深く理解を示す質問ができている',
      point2: '基本的な相槌はできているが、深い理解は示せていない',
      point1: '相手の話を十分に聞けていない'
    },
    {
      item: '自己開示のバランス',
      point3: '適切なタイミングで自己開示ができている',
      point2: '時々自己開示のバランスが崩れる',
      point1: '一方的な自己開示が目立つ'
    },
    {
      item: '表情やジェスチャー',
      point3: '自然な笑顔とジェスチャーで会話を盛り上げている',
      point2: 'やや固い表情や不自然なジェスチャーが見られる',
      point1: '表情が乏しく、ボディランゲージも少ない'
    }
  ]

  // 評価項目の登録
  for (const item of evaluationItems) {
    await prisma.evaluationItem.upsert({
      where: { item: item.item },
      update: item,
      create: item
    })
  }

  // プロンプトの初期データ
  const defaultPrompt = `与えられた動画を分析し、以下の恋愛評価項目を採点してください。
各項目は3点満点で評価し、具体的なメモを付けてください。

評価項目は以下の通りです：
- 相手の話への傾聴と反応
- 自己開示のバランス
- 表情やジェスチャー

動画データ: {{video_data}}

結果はJSON形式で出力してください。
出力形式は以下:
{
  "評価結果": {
    "項目名": {
      "点数": 数値(1-3),
      "メモ": "具体的な評価コメント"
    }
  },
  "総合評価": "全体的な評価コメント",
  "特に良かった点": "具体的な良かった点",
  "改善が必要な点": "具体的な改善点",
  "次回への課題": "次回に向けての具体的なアドバイス"
}`

  // プロンプトの登録
  await prisma.prompt.upsert({
    where: { id: 1 },
    update: { prompt: defaultPrompt },
    create: { prompt: defaultPrompt }
  })

  console.log('Seed data has been successfully inserted')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
