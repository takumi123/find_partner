import { Video } from '@prisma/client';
import Link from 'next/link';

type Props = {
  videos: Video[];
};

export function VideoList({ videos }: Props) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '分析完了';
      case 'analyzing':
        return '分析中';
      case 'error':
        return 'エラー';
      case 'uploading_youtube':
        return 'YouTube アップロード中';
      default:
        return '未分析';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ステータス</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">分析日時</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">YouTube</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">アクション</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {videos.map((video) => (
            <tr key={video.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{video.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${video.status === 'completed' ? 'bg-green-100 text-green-800' :
                    video.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                    video.status === 'uploading_youtube' ? 'bg-blue-100 text-blue-800' :
                    video.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-black'}`}>
                  {getStatusText(video.status)}
                  {video.status === 'analyzing' || video.status === 'uploading_youtube' ? (
                    <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {video.analysisDate ? new Date(video.analysisDate).toLocaleString('ja-JP') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {video.youtubeUrl ? (
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-900"
                  >
                    視聴する
                  </a>
                ) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link
                  href={`/video/${video.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  詳細を見る
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
