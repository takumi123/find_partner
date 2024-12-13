'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <nav className="mt-5 px-2">
        <Link
          href="/"
          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
            isActive('/') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          ホーム
        </Link>


          
            <Link
              href="/evaluations"
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                isActive('/evaluations') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              評価項目管理
            </Link>
         
        
      </nav>
    </div>
  );
}