import {
  doc,
  updateDoc,
  increment,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';

function fire(p: Promise<unknown>) {
  p.catch((err) => console.warn('[stats]', err));
}

/**
 * 토너먼트 참가 기록 — swipedRestaurants 전체에 대해 호출
 * restaurants.tournamentCount++
 */
export function recordTournamentEntry(restaurantId: string) {
  fire(
    updateDoc(doc(db, 'restaurants', restaurantId), {
      tournamentCount: increment(1),
    })
  );
}

/**
 * 토너먼트 최종 우승 — winCount++ 후 winRate 재계산 (transaction)
 */
export async function recordWin(restaurantId: string) {
  const ref = doc(db, 'restaurants', restaurantId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() ?? {};
      const newWinCount = (data.winCount ?? 0) + 1;
      const tournamentCount = Math.max(data.tournamentCount ?? 1, 1);
      const winRate = newWinCount / tournamentCount;
      tx.update(ref, { winCount: newWinCount, winRate });
    });
  } catch (err) {
    console.warn('[stats] recordWin 실패', err);
  }
}

/**
 * 토너먼트 결과를 tournament_history 컬렉션에 저장.
 * uid가 없으면(비로그인) 건너뜀 (rules: request.auth != null).
 */
export function recordTournamentHistory({
  uid,
  winnerId,
  winnerName,
  participants,
  location,
}: {
  uid: string | null;
  winnerId: string;
  winnerName: string;
  participants: string[];
  location: string;
}) {
  if (!uid) return;
  fire(
    addDoc(collection(db, 'tournament_history'), {
      uid,
      winnerId,
      winnerName,
      participants,
      location,
      createdAt: serverTimestamp(),
    })
  );
}
