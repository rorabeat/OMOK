export const PLAYER_NAME_KEY = 'omok-player-name';
export const SCOREBOARD_KEY = 'omok-scoreboard-txt';

export const SCORE_VALUES = Object.freeze({
  win: 10,
  draw: 1,
  loss: 0,
});

export function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 20);
}

export function parseScoreboardText(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name = '', score = '0', wins = '0', draws = '0', losses = '0'] = line.split('|');
      return {
        name: normalizeName(name),
        score: Number(score) || 0,
        wins: Number(wins) || 0,
        draws: Number(draws) || 0,
        losses: Number(losses) || 0,
      };
    })
    .filter(entry => entry.name);
}

export function formatScoreboardText(entries) {
  return entries
    .map(entry => [
      entry.name,
      entry.score,
      entry.wins,
      entry.draws,
      entry.losses,
    ].join('|'))
    .join('\n');
}

export function sortScoreboard(entries) {
  return [...entries].sort((a, b) =>
    b.score - a.score ||
    b.wins - a.wins ||
    a.losses - b.losses ||
    a.name.localeCompare(b.name),
  );
}

export function recordScore(entries, playerName, result) {
  const name = normalizeName(playerName);
  if (!name) return sortScoreboard(entries);

  const nextEntries = [...entries];
  const currentIndex = nextEntries.findIndex(entry => entry.name === name);
  const current = currentIndex >= 0
    ? { ...nextEntries[currentIndex] }
    : { name, score: 0, wins: 0, draws: 0, losses: 0 };

  current.score += SCORE_VALUES[result] ?? 0;
  if (result === 'win') current.wins += 1;
  if (result === 'draw') current.draws += 1;
  if (result === 'loss') current.losses += 1;

  if (currentIndex >= 0) nextEntries[currentIndex] = current;
  else nextEntries.push(current);

  return sortScoreboard(nextEntries);
}

export function getTopScores(entries, count = 5) {
  return sortScoreboard(entries).slice(0, count);
}
