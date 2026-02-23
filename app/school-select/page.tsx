'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { setUserSchool } from '@/lib/firebase/users';
import type { School } from '@/types';

interface UnivItem {
  name: string;
  domain: string;
}

export default function SchoolSelectPage() {
  const router = useRouter();
  const { user, setSchool, isLoading } = useAuthStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnivItem[]>([]);
  const [selected, setSelected] = useState<UnivItem | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 이미 학교가 설정된 유저는 홈으로
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
    if (!isLoading && user?.school) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      // 빈 검색어 → 전체 목록 (빠른 로딩)
      debounceRef.current = setTimeout(() => fetchUniversities(''), 100);
      return;
    }

    debounceRef.current = setTimeout(() => fetchUniversities(query.trim()), 350);
  }, [query]);

  async function fetchUniversities(q: string) {
    setFetching(true);
    try {
      const res = await fetch(`/api/universities?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.items ?? []);
    } catch {
      // 네트워크 오류 → 조용히 무시
    } finally {
      setFetching(false);
    }
  }

  async function handleConfirm() {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    try {
      const school: School = { name: selected.name, domain: selected.domain };
      await setUserSchool(user.uid, school);
      setSchool(school);
      router.replace('/');
    } catch (err) {
      console.error(err);
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EDD0' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EDD0' }}>
      {/* 헤더 */}
      <header style={{ borderBottom: '2px solid #1A1A1A' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#1A1A1A' }}>
            SCHOOL SELECT
          </span>
          <div
            className="text-xs font-black tracking-widest uppercase px-3 py-1"
            style={{ background: '#FF9900', color: '#1A1A1A', borderRadius: 2 }}
          >
            1회 설정
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* 안내 문구 */}
        <section>
          <h1
            className="font-black leading-tight mb-2"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: '#1A1A1A' }}
          >
            내 학교를<br />선택하세요
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#5C5C5C' }}>
            ⚠️학교는 한 번만 설정할 수 있어요.⚠️<br />
            토너먼트 결과가 우리 학교 맛집 피드에 자동으로 누적됩니다.
          </p>
        </section>

        {/* 검색창 */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="학교 이름 검색 (예: 연세)"
            className="w-full px-4 py-3 text-sm font-bold outline-none"
            style={{
              background: '#FFFFFF',
              border: '2px solid #1A1A1A',
              borderRadius: 4,
              color: '#1A1A1A',
            }}
          />
          {fetching && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }}
            />
          )}
        </div>

        {/* 결과 목록 */}
        <div
          className="flex-1 overflow-y-auto rounded"
          style={{
            border: results.length > 0 ? '2px solid #1A1A1A' : 'none',
            maxHeight: 340,
          }}
        >
          {results.map((item, idx) => (
            <button
              key={item.domain}
              onClick={() => setSelected(item)}
              className="w-full text-left px-4 py-3 text-sm font-bold transition-colors"
              style={{
                background: selected?.domain === item.domain ? '#FF9900' : '#FFFFFF',
                color: selected?.domain === item.domain ? '#1A1A1A' : '#1A1A1A',
                borderBottom: idx < results.length - 1 ? '1px solid #E8E4DC' : 'none',
              }}
            >
              {item.name}
            </button>
          ))}

          {!fetching && results.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: '#8C8C8C' }}>
              검색 결과가 없습니다
            </div>
          )}
        </div>

        {/* 선택된 학교 확인 */}
        {selected && (
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ background: '#1A1A1A', borderRadius: 4 }}
          >
            <div>
              <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#FF9900' }}>
                선택한 학교
              </p>
              <p className="text-base font-black mt-0.5" style={{ color: '#FFFFFF' }}>
                {selected.name}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm font-bold"
              style={{ color: '#8C8C8C' }}
            >
              취소
            </button>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <p className="text-sm font-bold text-center" style={{ color: '#FF3333' }}>
            {error}
          </p>
        )}

        {/* 확정 버튼 */}
        <button
          onClick={handleConfirm}
          disabled={!selected || saving}
          className="w-full py-4 text-sm font-black tracking-widest uppercase transition-opacity"
          style={{
            background: selected ? '#FF9900' : '#D0CABC',
            color: selected ? '#1A1A1A' : '#8C8C8C',
            borderRadius: 4,
            opacity: saving ? 0.7 : 1,
            cursor: selected && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? '저장 중...' : '이 학교로 확정하기'}
        </button>

        <p className="text-xs text-center" style={{ color: '#8C8C8C' }}>
          학교 변경이 필요하면 마이페이지에서 건의하세요
        </p>
      </main>
    </div>
  );
}
