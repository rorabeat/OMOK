import { DIFFICULTY } from '../constants/config.js';
import './DifficultyModal.css';

const LABELS = {
  [DIFFICULTY.EASY]:   '쉬움',
  [DIFFICULTY.NORMAL]: '보통',
  [DIFFICULTY.HARD]:   '어려움',
};

export default function DifficultyModal({ visible, onSelect }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">OMOK</h2>
        <p className="modal-subtitle">난이도를 선택하세요</p>
        <div className="modal-buttons">
          {[DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD].map(d => (
            <button key={d} className="modal-btn" onClick={() => onSelect(d)}>
              {LABELS[d]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
