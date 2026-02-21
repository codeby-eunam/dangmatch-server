import { Restaurant } from '@/types';

export interface TournamentRound {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  matchIndex: number;
  restaurant1: Restaurant | null;
  restaurant2: Restaurant | null;
}

export function createTournament(restaurants: Restaurant[]): TournamentRound[] {
  if (restaurants.length < 2) {
    throw new Error('최소 2개 이상의 식당이 필요합니다');
  }

  // 2의 거듭제곱으로 맞추기 (8강 or 16강)
  const tournamentSize = restaurants.length <= 8 ? 8 : 16;
  
  // 셔플
  const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
  
  // 부전승 처리 (null로 채우기)
  const padded: (Restaurant | null)[] = [
    ...shuffled,
    ...Array(tournamentSize - shuffled.length).fill(null)
  ];

  const rounds: TournamentRound[] = [];
  let currentRound = 1;
  let currentRestaurants = padded;

  // 각 라운드 생성
  while (currentRestaurants.length > 1) {
    const matches: TournamentMatch[] = [];
    
    for (let i = 0; i < currentRestaurants.length; i += 2) {
      const r1 = currentRestaurants[i];
      const r2 = currentRestaurants[i + 1];
      
      // 둘 다 null이면 스킵
      if (!r1 && !r2) continue;
      
      // 한쪽만 null이면 자동 승리
      if (!r1 || !r2) {
        currentRestaurants[i / 2] = r1 || r2;
        continue;
      }
      
      matches.push({
        matchIndex: i / 2,
        restaurant1: r1,
        restaurant2: r2
      });
    }

    if (matches.length > 0) {
      rounds.push({
        round: currentRound,
        matches
      });
    }

    currentRound++;
    currentRestaurants = currentRestaurants.slice(0, currentRestaurants.length / 2);
  }

  return rounds;
}

export function getRoundName(round: number, totalRounds: number): string {
  const remainingMatches = Math.pow(2, totalRounds - round);
  
  if (round === totalRounds) return '결승';
  if (round === totalRounds - 1) return '준결승';
  if (remainingMatches === 4) return '준준결승';
  
  return `${remainingMatches * 2}강`;
}