'use client';

import { useState, useEffect } from 'react';
import { Video } from '@prisma/client';
import { VideoList } from './_components/video/VideoList';
import { VideoUpload } from './_components/video/VideoUpload';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) throw new Error('動画一覧の取得に失敗しました');
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '動画一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = () => {
    fetchVideos();
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 layout-text">新規動画アップロード</h2>
            <VideoUpload onUploadComplete={handleUploadComplete} />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4 layout-text">動画一覧</h2>
            {isLoading ? (
              <div className="layout-text">読み込み中...</div>
            ) : (
              <VideoList videos={videos} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
