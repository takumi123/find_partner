import { VertexAI } from '@google-cloud/vertexai';

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
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
  const location = 'asia-northeast1';
  const model = 'gemini-1.5-pro-002';

  const vertex = new VertexAI({ project, location });
  const generativeModel = vertex.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 1,
      topK: 32,
    },
  });

  const prompt = `以下の動画を分析し、以下のフォーマットに従って評価結果をJSON形式で出力してください。

  動画URL: ${videoUrl}

  評価項目：
  1. コミュニケーション力
  - 相手の話をよく聞き、適切な質問や応答ができているか
  - 自分の考えを明確に伝えることができているか

  評価基準：
  3点: 相手の話をよく聞き、適切な質問や応答ができる。自分の考えを明確に伝えることができる。
  2点: 对方的話を聞き、基本的な応答ができる。自分の考えを伝えることができるが、明確さに欠ける場合がある。
  1点: 相手の話を十分に聞けず、適切な応答ができない。自分の考えを明確に伝えることが難しい。

  出力フォーマット例:
  {
    "評価結果": {
      "コミュニケーション力": {
        "点数": 2.5,
        "メモ": "相手の話をよく聞き、適切な応答ができていたが、自分の考えを明確に伝えることに少し課題があった。"
      }
    },
    "総合評価": "動画のコミュニケーション力は概ね良好ですが、もう少し自分の考えを明確に伝える努力が必要です。",
    "特に良かった点": "相手の話をよく聞き、適切な質問をしていた点は特に良かったです。",
    "改善が必要な点": "自分の考えをもう少し明確に伝える必要があります。",
    "次回への課題": "自分の考えを伝える練習をもっとして、明確なコミュニケーションを目指しましょう。",
  }
    

  上記のフォーマットに従って、具体的な点数とメモを付けてください。`;

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

  // Ensure that '評価結果' is not empty
  if (Object.keys(evaluationData.評価結果).length === 0) {
    throw new Error('評価結果が正しく生成されませんでした');
  }

  return evaluationData;
}