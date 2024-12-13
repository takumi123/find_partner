'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-lg z-50">
      <div className="h-full flex items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Find Partner
        </Link>
      </div>
    </header>
  );
}