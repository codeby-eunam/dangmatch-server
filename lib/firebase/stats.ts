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
 * 우승 후 사용자가 입력한 방문 데이터를 restaurants 문서에 반영.
 * - price: 1인당 비용 → totalPriceSum / priceCount → avgPrice 갱신
 * - partySize: 방문 인원 → totalPartySizeSum / partySizeCount → avgPartySize 갱신
 * 둘 다 없으면 no-op.
 */
export async function recordVisitData(
  restaurantId: string,
  { price, partySize }: { price?: number; partySize?: number }
) {
  if (!price && !partySize) return;
  const ref = doc(db, 'restaurants', restaurantId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() ?? {};
      const updates: Record<string, number> = {};

      if (price != null && price > 0) {
        const newSum = (data.totalPriceSum ?? 0) + price;
        const newCount = (data.priceCount ?? 0) + 1;
        updates.totalPriceSum = newSum;
        updates.priceCount = newCount;
        updates.avgPrice = Math.round(newSum / newCount);
      }

      if (partySize != null && partySize > 0) {
        const newSum = (data.totalPartySizeSum ?? 0) + partySize;
        const newCount = (data.partySizeCount ?? 0) + 1;
        updates.totalPartySizeSum = newSum;
        updates.partySizeCount = newCount;
        updates.avgPartySize = Math.round((newSum / newCount) * 10) / 10;
      }

      tx.update(ref, updates);
    });
  } catch (err) {
    console.warn('[stats] recordVisitData 실패', err);
  }
}

/**
 * 1v1 토너먼트 패배 — loseCount++
 */
export function recordLoss(restaurantId: string) {
  fire(
    updateDoc(doc(db, 'restaurants', restaurantId), {
      loseCount: increment(1),
    })
  );
}

/**
 * 스와이프 선택 (YUMI) — choiceCount++
 */
export function recordSwipeChoice(restaurantId: string) {
  fire(
    updateDoc(doc(db, 'restaurants', restaurantId), {
      choiceCount: increment(1),
    })
  );
}

/**
 * 스와이프 패스 (PASS) — passCount++
 */
export function recordSwipePass(restaurantId: string) {
  fire(
    updateDoc(doc(db, 'restaurants', restaurantId), {
      passCount: increment(1),
    })
  );
}

/**
 * 토너먼트 결과를 tournament_history 컬렉션에 저장.
 * 비로그인 유저도 기록 가능 (uid: null 허용).
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
