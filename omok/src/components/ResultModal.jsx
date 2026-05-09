import './ResultModal.css';

const MESSAGES = {
  black: '플레이어 승리!',
  white: 'AI 승리...',
  draw: '무승부!',
};

function downloadScoreboard(scoreboardText) {
  const blob = new Blob([scoreboardText || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'omok-scoreboard.txt';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ResultModal({
  visible,
  gameStatus,
  winner,
  playerName,
  topScores,
  scoreboardText,
  onRestart,
  onChangeDifficulty,
}) {
  if (!visible) return null;
  const msg = gameStatus === 'draw' ? MESSAGES.draw : MESSAGES[winner];

  return (
    <div className="modal-overlay">
      <div className="modal result-modal">
        <p className="result-message">{msg}</p>
        <section className="scoreboard" aria-label="상위 점수">
          <div className="scoreboard-header">
            <span>{playerName}님의 점수 기록</span>
            <button
              className="score-download-btn"
              type="button"
              onClick={() => downloadScoreboard(scoreboardText)}
            >
              TXT 저장
            </button>
          </div>
          {topScores.length > 0 ? (
            <ol className="score-list">
              {topScores.map((entry, index) => (
                <li className="score-item" key={entry.name}>
                  <span className="score-rank">{index + 1}</span>
                  <span className="score-name">{entry.name}</span>
                  <span className="score-value">{entry.score}점</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="score-empty">아직 점수 기록이 없습니다.</p>
          )}
        </section>
        <div className="modal-buttons">
          <button className="modal-btn" onClick={onRestart}>다시 하기</button>
          <button className="modal-btn" onClick={onChangeDifficulty}>난이도 변경</button>
        </div>
      </div>
    </div>
  );
}
