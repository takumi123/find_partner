'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';

export default function VideoUploadWithBlob() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUploadClick = async () => {
    setError(null);
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

      const videoUrl = newBlob.url;

      await requestAnalysis(videoUrl);


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
          className={`px-4 py-2 rounded-lg text-white ${
            isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isUploading ? 'アップロード中...' : 'アップロードと解析開始'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
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
    </div>
  );
}
