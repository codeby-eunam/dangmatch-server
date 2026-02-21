'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4">🍽️</h1>
        <h2 className="text-4xl font-bold mb-4">오늘 뭐 먹지?</h2>
        <p className="text-gray-600 mb-8">
          토너먼트로 결정하세요
        </p>
        <button
          onClick={() => router.push('/location')}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}