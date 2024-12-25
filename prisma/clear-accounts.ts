import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // アカウントテーブルをクリア
    await prisma.account.deleteMany({
      where: {
        provider: 'google'
      }
    })
    console.log('Googleアカウントの認証情報をクリアしました')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
