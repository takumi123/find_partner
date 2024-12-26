'use client';

import { useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';

type VideoUploadProps = {
  onUploadComplete?: () => void;
};

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStatus = (step: string) => {
    setCurrentStep(step);
    console.log(`現在の処理: ${step}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (!session?.user) {
        throw new Error("ログインが必要です");
      }

      const files = fileInputRef.current?.files;
      if (!files || files.length === 0) {
        throw new Error("動画ファイルを選択してください");
      }

      const file = files[0];
      if (!file.type.startsWith('video/mp4')) {
        throw new Error("MP4形式の動画ファイルのみアップロード可能です");
      }

      updateStatus('動画ファイルをアップロード中...');
      setUploadProgress(0);
      
      // FormDataの作成
      const formData = new FormData();
      formData.append('file', file);

      // 動画ファイルをアップロード
      const uploadResponse = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || 'アップロードに失敗しました');
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(50);

      // 分析の進行状況を確認
      const checkAnalysis = async () => {
        const response = await fetch(`/api/videos/${uploadResult.id}`);
        const data = await response.json();

        if (data.status === 'error') {
          throw new Error(data.errorMessage || '分析中にエラーが発生しました');
        }

        if (data.status === 'completed') {
          setUploadProgress(100);
          updateStatus('完了');
          onUploadComplete?.();
          return;
        }

        // まだ完了していない場合は再度チェック
        setUploadProgress(prev => Math.min(prev + 5, 90));
        setTimeout(checkAnalysis, 5000);
      };

      // 分析の進行状況チェックを開始
      setTimeout(checkAnalysis, 5000);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '処理に失敗しました';
      setError(errorMessage);
      console.error('Error details:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-4">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="p-4">
        <button
          onClick={() => signIn('google')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">動画アップロード</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            MP4形式の動画ファイルをアップロードしてください
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full px-4 py-2 rounded-lg text-white ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? '処理中...' : 'アップロードと解析開始'}
          </button>
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">{currentStep}</p>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
