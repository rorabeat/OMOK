import { useCallback, useEffect, useState } from 'react';
import { normalizeName } from '../logic/scoreboard.js';
import {
  subscribeScoreboard,
  recordScoreRemote,
} from '../logic/firestoreScoreboard.js';

const PLAYER_NAME_KEY = 'omok-player-name';

function readStoredName() {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeName(window.localStorage.getItem(PLAYER_NAME_KEY));
  } catch {
    return '';
  }
}

export function useScoreboard() {
  const [playerName, setPlayerNameState] = useState(readStoredName);
  const [entries, setEntries] = useState([]);

  // 이름을 localStorage에 유지
  useEffect(() => {
    try { window.localStorage.setItem(PLAYER_NAME_KEY, playerName); } catch { /* noop */ }
  }, [playerName]);

  // Firestore 실시간 구독 — 다른 플레이어가 점수를 올리면 자동 갱신
  useEffect(() => {
    const unsubscribe = subscribeScoreboard(setEntries);
    return unsubscribe;
  }, []);

  const setPlayerName = useCallback((name) => {
    setPlayerNameState(normalizeName(name));
  }, []);

  const addGameResult = useCallback(async (result) => {
    try {
      await recordScoreRemote(playerName, result);
    } catch (err) {
      console.error('점수 저장 실패:', err);
    }
  }, [playerName]);

  const topScores = entries.slice(0, 5);

  return {
    playerName,
    setPlayerName,
    entries,
    topScores,
    addGameResult,
  };
}
