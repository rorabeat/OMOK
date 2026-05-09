import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PLAYER_NAME_KEY,
  SCOREBOARD_KEY,
  formatScoreboardText,
  getTopScores,
  normalizeName,
  parseScoreboardText,
  recordScore,
} from '../logic/scoreboard.js';

function readStoredName() {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeName(window.localStorage.getItem(PLAYER_NAME_KEY));
  } catch {
    return '';
  }
}

function readStoredScores() {
  if (typeof window === 'undefined') return [];
  try {
    return parseScoreboardText(window.localStorage.getItem(SCOREBOARD_KEY));
  } catch {
    return [];
  }
}

export function useScoreboard() {
  const [playerName, setPlayerNameState] = useState(readStoredName);
  const [entries, setEntries] = useState(readStoredScores);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // Storage can be unavailable in some privacy modes.
    }
  }, [playerName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SCOREBOARD_KEY, formatScoreboardText(entries));
    } catch {
      // Keep the in-memory score usable even when storage fails.
    }
  }, [entries]);

  const setPlayerName = useCallback((name) => {
    setPlayerNameState(normalizeName(name));
  }, []);

  const addGameResult = useCallback((result) => {
    setEntries(prev => recordScore(prev, playerName, result));
  }, [playerName]);

  const topScores = useMemo(() => getTopScores(entries, 5), [entries]);
  const scoreboardText = useMemo(() => formatScoreboardText(entries), [entries]);

  return {
    playerName,
    setPlayerName,
    entries,
    topScores,
    scoreboardText,
    addGameResult,
  };
}
