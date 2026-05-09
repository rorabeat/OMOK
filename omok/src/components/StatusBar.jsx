import './StatusBar.css';

export default function StatusBar({ turn, isAIThinking, canUndo, gameStatus, onUndo, onRestart, onChangeDifficulty }) {
  let statusText = '';
  if (gameStatus === 'playing') {
    if (isAIThinking) statusText = 'AI 생각 중…';
    else statusText = turn === 'black' ? '● 플레이어 차례' : '○ AI 차례';
  }

  return (
    <div className="status-bar">
      <div className="status-text">
        {isAIThinking && gameStatus === 'playing' && (
          <span className="ai-spinner" aria-hidden />
        )}
        <span>{statusText}</span>
      </div>
      <div className="status-buttons">
        <button className="btn" onClick={onUndo} disabled={!canUndo}>무르기</button>
        <button className="btn" onClick={onRestart}>재시작</button>
        <button className="btn" onClick={onChangeDifficulty}>난이도 변경</button>
      </div>
    </div>
  );
}
