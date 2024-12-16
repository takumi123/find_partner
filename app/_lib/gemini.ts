import { VertexAI } from '@google-cloud/vertexai';
import { prisma } from './prisma';

export interface EvaluationResult {
  点数: number;
  メモ: string;
}

export interface AnalysisData {
  評価結果: {
    [key: string]: EvaluationResult;
  };
  総合評価: string;
  特に良かった点: string;
  改善が必要な点: string;
  次回への課題: string;
}

export async function analyzeVideo(videoUrl: string): Promise<AnalysisData> {
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is not set.');
  }

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required.');
  }

  const authOptions = {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
  };

  const location = 'asia-northeast1';
  const model = 'gemini-1.5-pro-002';

  // 評価項目を取得
  const evaluationItems = await prisma.evaluationItem.findMany();

  const vertex = new VertexAI({
    project,
    location,
    googleAuthOptions: authOptions,
  });

  const generativeModel = vertex.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 1,
      topK: 32,
    },
  });

  // 評価項目の文字列を構築
  const evaluationItemsText = evaluationItems.map((item, index) => `
  ${index + 1}. ${item.item}
  - 3点: ${item.point3}
  - 2点: ${item.point2}
  - 1点: ${item.point1}
  `).join('\n');

  // 出力フォーマット例の評価結果を構築
  const exampleEvaluationResults = evaluationItems.reduce((acc, item) => {
    acc[item.item] = {
      "点数": 2,
      "メモ": `${item.item}について、基準に基づいて評価したコメントがここに入ります。`
    };
    return acc;
  }, {} as { [key: string]: { 点数: number; メモ: string } });

  const prompt = `以下の動画を分析し、以下のフォーマットに従って評価結果をJSON形式で出力してください。
  各評価項目は1点から3点の整数で評価してください。小数点は使用しないでください。

  動画URL: ${videoUrl}

  評価項目と評価基準：
  ${evaluationItemsText}

  出力フォーマット例:
  {
    "評価結果": ${JSON.stringify(exampleEvaluationResults, null, 2)},
    "総合評価": "全体的な評価をここに記述します。",
    "特に良かった点": "特に優れていた点をここに記述します。",
    "改善が必要な点": "改善が必要な点をここに記述します。",
    "次回への課題": "次回に向けての課題をここに記述します。"
  }
    
  上記のフォーマットに従って、各評価項目を1-3点の整数で評価し、具体的なメモを付けてください。`;

  const result = await generativeModel.generateContent(prompt);
  const response = await result.response;

  if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('生成されたテキストが見つかりません');
  }

  // Update the parsing logic to remove any leading and trailing non-JSON content
  const rawText = response.candidates[0].content.parts[0].text;
  const jsonText = rawText.replace(/```json\n?/, '').trim(); // Remove the format indicator and trim whitespace
  const jsonEndIndex = jsonText.lastIndexOf('}'); // Find the last '}' to ensure we only take the JSON content
  const jsonSubstring = jsonText.substring(0, jsonEndIndex + 1); // Extract the JSON content
  const evaluationData: AnalysisData = JSON.parse(jsonSubstring);

  // Ensure that '評価結果' is not empty and all scores are integers between 1-3
  if (Object.keys(evaluationData.評価結果).length === 0) {
    throw new Error('評価結果が正しく生成されませんでした');
  }

  // Validate scores
  for (const [item, result] of Object.entries(evaluationData.評価結果)) {
    const score = result.点数;
    if (!Number.isInteger(score) || score < 1 || score > 3) {
      throw new Error(`評価項目「${item}」のスコアが不正です（${score}）。スコアは1から3の整数である必要があります。`);
    }
  }

  return evaluationData;
}