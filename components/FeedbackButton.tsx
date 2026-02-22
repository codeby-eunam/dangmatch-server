'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/store/auth';

type FeedbackType = 'feedback' | 'report';

export default function FeedbackButton() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      await addDoc(collection(db, 'feedback'), {
        type,
        message: message.trim(),
        uid: user?.uid ?? null,
        nickname: user?.nickname ?? null,
        createdAt: serverTimestamp(),
      });
      setStatus('done');
      setMessage('');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('[피드백 저장 실패]', err);
      setStatus('error');
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 px-4 py-2 text-xs font-medium transition-opacity hover:opacity-70 active:scale-95 flex items-center gap-1.5"
        style={{ background: '#F0EDEA', color: '#8C8C8C', border: '1px solid #F0EDEA' }}
        aria-label="피드백 남기기"
      >
        피드백
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          style={{ background: 'rgba(31,31,31,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm p-6" style={{ background: '#FFFDF9' }}>
            <h3 className="text-base font-black mb-1" style={{ color: '#1F1F1F' }}>
              {type === 'feedback' ? '피드백' : '신고'}
            </h3>
            <p className="text-xs mb-4" style={{ color: '#8C8C8C' }}>
              {type === 'feedback'
                ? '불편한 점이나 개선 의견을 알려주세요'
                : '잘못된 정보나 문제를 신고해주세요'}
            </p>

            {/* 타입 토글 */}
            <div className="flex gap-2 mb-4">
              {(['feedback', 'report'] as FeedbackType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex-1 py-2 text-xs font-bold tracking-widest uppercase transition-all"
                  style={type === t
                    ? { background: '#1F1F1F', color: '#FFFDF9' }
                    : { background: '#F0EDEA', color: '#8C8C8C' }
                  }
                >
                  {t === 'feedback' ? '피드백' : '신고'}
                </button>
              ))}
            </div>

            {/* 텍스트 영역 */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'feedback'
                  ? '예) 스와이프가 너무 빠르게 넘어가요'
                  : '예) ○○ 식당 정보가 잘못됐어요'
              }
              rows={4}
              className="w-full p-3 text-sm resize-none outline-none mb-4"
              style={{
                background: '#F0EDEA',
                color: '#1F1F1F',
                border: '1.5px solid #F0EDEA',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF4D2E')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#F0EDEA')}
              disabled={status === 'sending' || status === 'done'}
            />

            {status === 'done' && (
              <p className="text-xs text-center mb-3 font-medium" style={{ color: '#FF4D2E' }}>
                감사합니다! 소중한 의견이 전달됐어요.
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-center mb-3" style={{ color: '#FF4D2E' }}>
                전송에 실패했어요. 다시 시도해주세요.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setStatus('idle'); setMessage(''); }}
                className="flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-60"
                style={{ background: '#F0EDEA', color: '#8C8C8C' }}
                disabled={status === 'sending'}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || status === 'sending' || status === 'done'}
                className="flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ background: '#FF4D2E', color: '#FFFDF9' }}
              >
                {status === 'sending' ? '전송 중...' : '보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
