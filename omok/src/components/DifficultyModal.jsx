import { DIFFICULTY } from '../constants/config.js';
import './DifficultyModal.css';

const LABELS = {
  [DIFFICULTY.EASY]:   '쉬움',
  [DIFFICULTY.NORMAL]: '보통',
  [DIFFICULTY.HARD]:   '어려움',
};

export default function DifficultyModal({ visible, playerName, onNameChange, onSelect }) {
  if (!visible) return null;
  const canStart = playerName.trim().length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">OMOK</h2>
        <label className="player-name-field">
          <span className="player-name-label">플레이어 이름</span>
          <input
            className="player-name-input"
            type="text"
            value={playerName}
            maxLength={20}
            placeholder="이름 입력"
            autoFocus
            onChange={(e) => onNameChange(e.target.value)}
          />
        </label>
        <p className="modal-subtitle">난이도를 선택하세요</p>
        <div className="modal-buttons">
          {[DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD].map(d => (
            <button key={d} className="modal-btn" onClick={() => onSelect(d)} disabled={!canStart}>
              {LABELS[d]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
