import { describe, expect, it } from 'vitest';
import {
  formatScoreboardText,
  getTopScores,
  parseScoreboardText,
  recordScore,
} from './scoreboard.js';

describe('scoreboard', () => {
  it('records wins, draws, and losses by player name', () => {
    let entries = [];
    entries = recordScore(entries, 'Mina', 'win');
    entries = recordScore(entries, 'Mina', 'draw');
    entries = recordScore(entries, 'Mina', 'loss');

    expect(entries).toEqual([
      { name: 'Mina', score: 11, wins: 1, draws: 1, losses: 1 },
    ]);
  });

  it('sorts top five by score', () => {
    const entries = [
      { name: 'A', score: 1, wins: 0, draws: 1, losses: 0 },
      { name: 'B', score: 30, wins: 3, draws: 0, losses: 0 },
      { name: 'C', score: 10, wins: 1, draws: 0, losses: 0 },
      { name: 'D', score: 20, wins: 2, draws: 0, losses: 0 },
      { name: 'E', score: 2, wins: 0, draws: 2, losses: 0 },
      { name: 'F', score: 40, wins: 4, draws: 0, losses: 0 },
    ];

    expect(getTopScores(entries).map(entry => entry.name)).toEqual(['F', 'B', 'D', 'C', 'E']);
  });

  it('round-trips the txt storage format', () => {
    const entries = [
      { name: 'Mina', score: 11, wins: 1, draws: 1, losses: 1 },
      { name: 'Joon', score: 20, wins: 2, draws: 0, losses: 0 },
    ];

    expect(parseScoreboardText(formatScoreboardText(entries))).toEqual(entries);
  });
});
