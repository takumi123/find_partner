'use client';

import Link from 'next/link';
import { VideoAnalysisResult } from '../../_components/video/VideoAnalysisResult';
import { Video, EvaluationData } from '../../_types/video';

interface Props {
  video: Video;
}

export function VideoDetailClient({ video }: Props) {
  // デバッグログ
  console.log('ビデオデータ:', video);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            動画分析結果 #{video.id}
          </h1>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← 一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-8">
          {/* ステータス表示 */}
          <div className="flex items-center">
            <span className={`px-2 py-1 text-sm font-semibold rounded-full
              ${video.status === 'completed' ? 'bg-green-100 text-green-800' :
                video.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                video.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'}`}>
              {video.status === 'completed' ? '分析完了' :
               video.status === 'analyzing' ? '分析中' :
               video.status === 'error' ? 'エラー' :
               '未分析'}
            </span>
            {video.analysisDate && (
              <span className="ml-4 text-sm text-gray-500">
                分析完了: {new Date(video.analysisDate).toLocaleString('ja-JP')}
              </span>
            )}
          </div>

          {/* 動画表示 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">動画</h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={video.videoUrl || ''}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              >
                お使いのブラウザは動画の再生に対応していません。
              </video>
            </div>
            <div className="text-sm text-gray-500">
              URL: <a href={video.videoUrl || ''} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{video.videoUrl || ''}</a>
            </div>
          </div>

          {/* 分析中の表示 */}
          {video.status === 'analyzing' && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">分析を実行中です...</span>
            </div>
          )}

          {/* エラー時の表示 */}
          {video.status === 'error' && (
            <VideoAnalysisResult
              evaluationData={null}
              error={video.errorMessage || '分析中にエラーが発生しました'}
            />
          )}

          {/* 分析結果の表示 */}
          {video.status === 'completed' && video.evaluationData && (
            <VideoAnalysisResult
              evaluationData={video.evaluationData as EvaluationData}
            />
          )}

          {/* デバッグ情報（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">ビデオ情報</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(video, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
