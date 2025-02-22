import { AnalysisData } from '../../_lib/gemini';

type Props = {
  evaluationData: AnalysisData | null;
  error?: string;
};

interface TimelineJumpProps {
  onTimeClick?: (time: number) => void;
}

export function VideoAnalysisResult({ evaluationData, error, onTimeClick }: Props & TimelineJumpProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  if (!evaluationData) {
    return (
      <div className="text-black">
        分析結果はまだありません
      </div>
    );
  }

  // デバッグ情報の表示
  console.log('評価データ:', evaluationData);

  return (
    <div className="space-y-8">
      {/* 評価結果テーブル */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-black">評価項目別スコア</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  評価項目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  スコア
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  コメント
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(evaluationData.評価結果).map(([item, result]) => (
                <tr key={item}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {result.点数} / 3
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {result.メモ}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 総合評価と詳細コメント */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-black">総合評価</h3>
          <p className="text-black whitespace-pre-wrap">{evaluationData.総合評価}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-black">特に良かった点</h3>
          <p className="text-black whitespace-pre-wrap">{evaluationData.特に良かった点}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-black">改善が必要な点</h3>
          <p className="text-black whitespace-pre-wrap">{evaluationData.改善が必要な点}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-black">次回への課題</h3>
          <p className="text-black whitespace-pre-wrap">{evaluationData.次回への課題}</p>
        </div>
      </div>

      {/* タイムライン評価 */}
      {evaluationData.タイムライン評価 && evaluationData.タイムライン評価.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-black">タイムライン評価</h3>
          <div className="space-y-4">
            {evaluationData.タイムライン評価
              .sort((a, b) => a.時間 - b.時間)
              .map((timeline, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <button
                    onClick={() => onTimeClick?.(timeline.時間)}
                    className="text-blue-600 hover:text-blue-800 font-medium mb-2"
                  >
                    {Math.floor(timeline.時間 / 60)}:{String(timeline.時間 % 60).padStart(2, '0')}
                  </button>
                  {timeline.良い点 && (
                    <div className="text-green-600 mt-1">
                      <span className="font-medium">良い点：</span>
                      {timeline.良い点}
                    </div>
                  )}
                  {timeline.悪い点 && (
                    <div className="text-red-600 mt-1">
                      <span className="font-medium">悪い点：</span>
                      {timeline.悪い点}
                    </div>
                  )}
                  <div className="text-gray-600 mt-1">
                    <span className="font-medium">理由：</span>
                    {timeline.理由}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">デバッグ情報</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(evaluationData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
