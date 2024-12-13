import { Video } from '@prisma/client';
import Link from 'next/link';

type Props = {
  videos: Video[];
};

export function VideoList({ videos }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ステータス</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">分析日時</th>
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
                    video.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-black'}`}>
                  {video.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                {video.analysisDate ? new Date(video.analysisDate).toLocaleString('ja-JP') : '-'}
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
