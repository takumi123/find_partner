import { useState } from 'react';
import type { PutBlobResult } from '@vercel/blob';

type Props = {
  onUploadComplete: () => void;
};

export function VideoUpload({ onUploadComplete }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setError(null);

      // 1. まずVercel Blobにアップロード
      const blobResponse = await fetch(
        `/api/upload?filename=${encodeURIComponent(selectedFile.name)}`,
        {
          method: 'POST',
          body: selectedFile,
        }
      );

      if (!blobResponse.ok) {
        const error = await blobResponse.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const blob = await blobResponse.json() as PutBlobResult;
      console.log('Uploaded to Vercel Blob:', blob.url);

      // 2. データベースに登録
      const formData = new FormData();
      formData.append('videoUrl', blob.url);

      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登録に失敗しました');
      }

      setUploadStatus('analyzing');
      const data = await response.json();
      console.log('Registration success:', data);
      setSelectedFile(null);
      
      // ファイル入力をリセット
      const fileInput = document.getElementById('video') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsUploading(false);
      setUploadStatus('idle');
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'アップロード中...';
      case 'analyzing':
        return 'Geminiで分析中...';
      default:
        return '分析開始';
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="video"
            className="block text-sm font-medium text-black"
          >
            動画ファイル
          </label>
          <input
            type="file"
            id="video"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-black
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-indigo-600">
              選択中: {selectedFile.name}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${isUploading || !selectedFile
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          <div className="flex items-center space-x-2">
            {isUploading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{getStatusMessage()}</span>
          </div>
        </button>
      </form>
    </div>
  );
}
