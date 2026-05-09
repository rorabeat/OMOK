import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { normalizeName, sortScoreboard, SCORE_VALUES } from './scoreboard.js';

const COLLECTION = 'omok_scores';

/**
 * Firestore의 omok_scores 컬렉션을 실시간으로 구독한다.
 * 문서 하나 = 플레이어 한 명 (문서 ID = 이름).
 * @param {function} onUpdate - entries 배열을 받는 콜백
 * @returns {function} unsubscribe 함수
 */
export function subscribeScoreboard(onUpdate) {
  return onSnapshot(collection(db, COLLECTION), (snapshot) => {
    const entries = snapshot.docs.map((d) => ({ name: d.id, ...d.data() }));
    onUpdate(sortScoreboard(entries));
  });
}

/**
 * 게임 결과를 Firestore에 기록한다.
 * 트랜잭션으로 동시 접근 충돌을 방지한다.
 */
export async function recordScoreRemote(playerName, result) {
  const name = normalizeName(playerName);
  if (!name) return;

  const ref = doc(collection(db, COLLECTION), name);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? snap.data()
      : { score: 0, wins: 0, draws: 0, losses: 0 };

    const delta = SCORE_VALUES[result] ?? 0;
    tx.set(ref, {
      score:  current.score  + delta,
      wins:   current.wins   + (result === 'win'  ? 1 : 0),
      draws:  current.draws  + (result === 'draw' ? 1 : 0),
      losses: current.losses + (result === 'loss' ? 1 : 0),
    });
  });
}
