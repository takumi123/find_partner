'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoUploadWithBlob() {
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isYoutubeUploading, setIsYoutubeUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null);
  const [showYoutubeForm, setShowYoutubeForm] = useState(false);
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeDescription, setYoutubeDescription] = useState('');

  const uploadFile = async (file: File) => {
    console.log('Uploading file to blob storage...');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: 'POST',
        body: file,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'アップロードに失敗しました');
    }

    const result = await response.json() as PutBlobResult;
    console.log('Uploaded blob:', result);
    return result;
  };

  const requestAnalysis = async (videoUrl: string) => {
    console.log('Requesting video analysis for URL:', videoUrl);
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '分析リクエストに失敗しました');
      }
      const result = await response.json();
      console.log('Analysis result:', result);
      return result;
    } catch (error) {
      console.error('Analysis request error:', error);
      throw error;
    }
  };

  const updateVideoStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const uploadToYoutube = async () => {
    if (!videoId) return;

    try {
      setIsYoutubeUploading(true);
      setError(null);
      await updateVideoStatus(videoId, 'uploading_youtube');

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          title: youtubeTitle,
          description: youtubeDescription,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'YouTubeへのアップロードに失敗しました');
      }

      const result = await response.json();
      console.log('YouTube upload result:', result);
      setSuccess('YouTubeへのアップロードが完了しました');
      router.refresh();
      setShowYoutubeForm(false);
    } catch (error) {
      console.error('YouTube upload error:', error);
      setError(error instanceof Error ? error.message : 'YouTubeへのアップロードに失敗しました');
      await updateVideoStatus(videoId, 'completed');
    } finally {
      setIsYoutubeUploading(false);
    }
  };

  const handleUploadClick = async () => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      if (!inputFileRef.current?.files || inputFileRef.current.files.length === 0) {
        throw new Error("ファイルが選択されていません");
      }

      const file = inputFileRef.current.files[0];

      if (!file.type.startsWith('video/')) {
        throw new Error("動画ファイルのみアップロード可能です");
      }

      const newBlob = await uploadFile(file);
      setBlob(newBlob);
      setSuccess('動画のアップロードが完了しました');

      const videoUrl = newBlob.url;
      const result = await requestAnalysis(videoUrl);
      setVideoId(result.id);
      setShowYoutubeForm(true);
      setSuccess('動画の分析が開始されました');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'アップロードに失敗しました';
      setError(errorMessage);
      console.error('Error details:', e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">動画アップロード</h2>
      <div className="space-y-4">
        <div>
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            accept="video/*"
            required
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className={`px-4 py-2 rounded-lg text-white flex items-center justify-center ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isUploading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isUploading ? 'アップロード中...' : 'アップロードと解析開始'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {blob && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700">アップロード成功！</p>
          <p className="mt-2 break-all">
            URL: <a href={blob.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{blob.url}</a>
          </p>
        </div>
      )}

      {showYoutubeForm && (
        <div className="mt-4 p-4 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">YouTubeにアップロード</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                タイトル
              </label>
              <input
                type="text"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                value={youtubeDescription}
                onChange={(e) => setYoutubeDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={uploadToYoutube}
              disabled={isYoutubeUploading || !youtubeTitle}
              className={`px-4 py-2 rounded-lg text-white flex items-center justify-center ${
                isYoutubeUploading || !youtubeTitle
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isYoutubeUploading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isYoutubeUploading ? 'アップロード中...' : 'YouTubeにアップロード'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
