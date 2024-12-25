'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { VideoAnalysisResult } from '../../_components/video/VideoAnalysisResult';
import { Video, EvaluationData } from '../../_types/video';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';

interface Props {
  video: Video;
}

export function VideoDetailClient({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<YouTubePlayer | null>(null);

  const handleTimeClick = (time: number) => {
    if (video.youtubeUrl && youtubePlayer) {
      youtubePlayer.seekTo(time);
      youtubePlayer.playVideo();
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

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
                video.status === 'uploading_youtube' ? 'bg-blue-100 text-blue-800' :
                video.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'}`}>
              {video.status === 'completed' ? '分析完了' :
               video.status === 'analyzing' ? '分析中' :
               video.status === 'uploading_youtube' ? 'YouTube アップロード中' :
               video.status === 'error' ? 'エラー' :
               '未分析'}
              {(video.status === 'analyzing' || video.status === 'uploading_youtube') && (
                <svg className="animate-spin ml-2 inline-block h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
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
              {video.youtubeUrl ? (
                <YouTube
                  videoId={getYoutubeVideoId(video.youtubeUrl) || undefined}
                  onReady={(event: YouTubeEvent) => setYoutubePlayer(event.target)}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                    },
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={video.videoUrl || ''}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  お使いのブラウザは動画の再生に対応していません。
                </video>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {video.youtubeUrl ? (
                <>
                  YouTube URL: <a href={video.youtubeUrl} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{video.youtubeUrl}</a>
                </>
              ) : (
                <>
                  URL: <a href={video.videoUrl || ''} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{video.videoUrl || ''}</a>
                </>
              )}
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
              onTimeClick={handleTimeClick}
            />
          )}

          {/* 分析結果の表示 */}
          {video.status === 'completed' && video.evaluationData && (
            <VideoAnalysisResult
              evaluationData={video.evaluationData as EvaluationData}
              onTimeClick={handleTimeClick}
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
