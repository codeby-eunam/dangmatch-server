'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function ReviewForm({ restaurantId }) {
  const [comment, setComment] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pricePerPerson =
    peopleCount && totalPrice && Number(peopleCount) > 0
      ? Math.round(Number(totalPrice) / Number(peopleCount))
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !peopleCount || !totalPrice) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        restaurantId,
        comment: comment.trim(),
        peopleCount: Number(peopleCount),
        totalPrice: Number(totalPrice),
        pricePerPerson: pricePerPerson ?? 0,
        createdAt: serverTimestamp(),
      });

      setComment('');
      setPeopleCount('');
      setTotalPrice('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('리뷰 저장 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
      {/* 사진 업로드 (비활성) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">사진</p>
        <div className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-400">준비 중</span>
        </div>
      </div>

      {/* 한 줄 후기 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          한 줄 후기
        </label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="예) 매운 떡볶이가 최고였어요!"
          maxLength={100}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* 인원 / 가격 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            인원 수
          </label>
          <div className="relative">
            <input
              type="number"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              min={1}
              placeholder="1"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-8 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              명
            </span>
          </div>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            총 가격
          </label>
          <div className="relative">
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              min={0}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-6 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              원
            </span>
          </div>
        </div>
      </div>

      {/* 1인 평균 자동 계산 */}
      {pricePerPerson !== null && (
        <div className="rounded-xl bg-orange-50 px-4 py-3">
          <span className="text-sm text-gray-500">1인 평균</span>
          <span className="ml-2 font-semibold text-orange-500">
            {pricePerPerson.toLocaleString()}원
          </span>
        </div>
      )}

      {/* 제출 */}
      <button
        type="submit"
        disabled={loading || !comment.trim() || !peopleCount || !totalPrice}
        className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition
          hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {loading ? '저장 중...' : '리뷰 남기기'}
      </button>

      {success && (
        <p className="text-center text-sm font-medium text-orange-500">
          리뷰가 저장되었습니다!
        </p>
      )}
    </form>
  );
}
