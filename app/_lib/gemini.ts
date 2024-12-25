import { VertexAI, SchemaType } from '@google-cloud/vertexai';

export interface EvaluationResult {
  点数: number;
  メモ: string;
}

export interface TimelineEvaluation {
  時間: number;  // 秒数
  良い点?: string;
  悪い点?: string;
  理由: string;
}

export interface AnalysisData {
  評価結果: {
    [key: string]: EvaluationResult;
  };
  総合評価: string;
  特に良かった点: string;
  改善が必要な点: string;
  次回への課題: string;
  タイムライン評価: TimelineEvaluation[];
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

  const vertex = new VertexAI({
    project,
    location,
    googleAuthOptions: authOptions,
  });

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      評価結果: {
        type: SchemaType.OBJECT,
        properties: {
          "相手の話への傾聴と反応": {
            type: SchemaType.OBJECT,
            properties: {
              点数: { type: SchemaType.INTEGER, minimum: 1, maximum: 3 },
              メモ: { type: SchemaType.STRING }
            },
            required: ["点数", "メモ"]
          },
          "自己開示のバランス": {
            type: SchemaType.OBJECT,
            properties: {
              点数: { type: SchemaType.INTEGER, minimum: 1, maximum: 3 },
              メモ: { type: SchemaType.STRING }
            },
            required: ["点数", "メモ"]
          },
          "表情やジェスチャー": {
            type: SchemaType.OBJECT,
            properties: {
              点数: { type: SchemaType.INTEGER, minimum: 1, maximum: 3 },
              メモ: { type: SchemaType.STRING }
            },
            required: ["点数", "メモ"]
          }
        },
        required: ["相手の話への傾聴と反応", "自己開示のバランス", "表情やジェスチャー"]
      },
      総合評価: { type: SchemaType.STRING },
      特に良かった点: { type: SchemaType.STRING },
      改善が必要な点: { type: SchemaType.STRING },
      次回への課題: { type: SchemaType.STRING },
      タイムライン評価: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            時間: { type: SchemaType.INTEGER, description: "動画の再生時間（秒）" },
            良い点: { type: SchemaType.STRING },
            悪い点: { type: SchemaType.STRING },
            理由: { type: SchemaType.STRING }
          },
          required: ["時間", "理由"]
        }
      }
    },
    required: ["評価結果", "総合評価", "特に良かった点", "改善が必要な点", "次回への課題", "タイムライン評価"]
  };

  const generativeModel = vertex.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 1,
      topK: 32,
      responseMimeType: "application/json",
      responseSchema: schema
    },
  });

  const prompt = `以下の動画を詳細に分析し、各評価項目について具体的な評価を行ってください。必ず以下の形式のJSONで回答してください：

  動画URL: ${videoUrl}

  {
    "評価結果": {
      "相手の話への傾聴と反応": {
        "点数": 評価点（1-3の整数）,
        "メモ": "評価の具体的な理由"
      },
      "自己開示のバランス": {
        "点数": 評価点（1-3の整数）,
        "メモ": "評価の具体的な理由"
      },
      "表情やジェスチャー": {
        "点数": 評価点（1-3の整数）,
        "メモ": "評価の具体的な理由"
      }
    },
    "総合評価": "全体的な印象を記述",
    "特に良かった点": "優れている点を具体的に記述",
    "改善が必要な点": "改善点を具体的に記述",
    "次回への課題": "次回に向けた具体的な課題を記述",
    "タイムライン評価": [
      {
        "時間": 秒数,
        "良い点": "良かった点の具体的な内容（該当する場合）",
        "悪い点": "改善が必要な点の具体的な内容（該当する場合）",
        "理由": "評価の理由"
      }
    ]
  }

  評価基準：

  2. タイムライン評価
  - 動画の重要なポイントについて、時系列で評価を行ってください
  - 各ポイントについて以下を記録：
    * 時間（秒）
    * 良い点または悪い点の具体的な内容
    * 評価の理由

  3. 総合評価
  - 動画全体の印象
  - 特に優れている点
  - 改善が必要な点
  - 次回への具体的な課題

  注意：すべての評価項目について、必ず1-3点の整数で評価を行い、具体的な理由を付けてください。`;

  console.log('生成するプロンプト:', prompt);

  const result = await generativeModel.generateContent(prompt);
  const response = await result.response;

  if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('生成されたテキストが見つかりません');
  }

  const rawText = response.candidates[0].content.parts[0].text;
  console.log('Geminiからの生のレスポンス:', rawText);

  let evaluationData: AnalysisData;
  try {
    evaluationData = JSON.parse(rawText);
  } catch (error) {
    console.error('JSONパースエラー:', error);
    throw new Error('評価結果のJSONパースに失敗しました: ' + (error as Error).message);
  }

  // 評価結果の検証
  if (!evaluationData.評価結果 || Object.keys(evaluationData.評価結果).length === 0) {
    console.error('空の評価結果:', evaluationData);
    throw new Error('評価結果が空です。すべての評価項目に対する評価が必要です。');
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
