import './ResultModal.css';

const MESSAGES = {
  black: '🎉 플레이어 승리!',
  white: 'AI 승리...',
  draw:  '🤝 무승부!',
};

export default function ResultModal({ visible, gameStatus, winner, onRestart, onChangeDifficulty }) {
  if (!visible) return null;
  const msg = gameStatus === 'draw' ? MESSAGES.draw : MESSAGES[winner];
  return (
    <div className="modal-overlay">
      <div className="modal result-modal">
        <p className="result-message">{msg}</p>
        <div className="modal-buttons">
          <button className="modal-btn" onClick={onRestart}>다시 하기</button>
          <button className="modal-btn" onClick={onChangeDifficulty}>난이도 변경</button>
        </div>
      </div>
    </div>
  );
}
