import { useGame } from './hooks/useGame.js';
import { useAI } from './hooks/useAI.js';
import { STONE, DIFFICULTY } from './constants/config.js';
import './index.css';

export default function App() {
  const game = useGame();

  useAI({
    turn: game.turn,
    gameStatus: game.gameStatus,
    board: game.board,
    difficulty: game.difficulty,
    placeStoneByAI: game.placeStoneByAI,
  });

  // ── 난이도 선택 화면 ──────────────────────────────────
  if (game.gameStatus === 'idle') {
    return (
      <div className="app">
        <h1>OMOK</h1>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {[DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD].map(d => (
            <button key={d} onClick={() => game.selectDifficulty(d)}
              style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}>
              {d === DIFFICULTY.EASY ? '쉬움' : d === DIFFICULTY.NORMAL ? '보통' : '어려움'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 게임 화면 (Phase 5에서 컴포넌트로 교체) ───────────
  const cellSize = 36;
  const stoneColors = { [STONE.BLACK]: '#1a1a1a', [STONE.WHITE]: '#f5f5f5' };

  return (
    <div className="app">
      <h1>OMOK — {game.difficulty}</h1>

      {/* 상태 표시 */}
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        {game.gameStatus === 'playing' && (
          game.isAIThinking
            ? '⏳ AI 생각 중…'
            : `● ${game.turn === 'black' ? '플레이어 차례' : 'AI 차례'}`
        )}
        {game.gameStatus === 'win' && `🎉 ${game.winner === 'black' ? '플레이어 승리!' : 'AI 승리!'}`}
        {game.gameStatus === 'draw' && '🤝 무승부!'}
      </div>

      {/* 보드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(15, ${cellSize}px)`,
        background: '#dcb468',
        padding: cellSize / 2,
        gap: 0,
        border: '2px solid #8b6914',
      }}>
        {game.board.map((row, r) =>
          row.map((cell, c) => {
            const isLast = game.lastMove?.row === r && game.lastMove?.col === c;
            const isWin = game.winCells.some(([wr, wc]) => wr === r && wc === c);
            const isForbid = game.forbiddenCells.some(([fr, fc]) => fr === r && fc === c);
            const canPlace = game.turn === 'black' && game.gameStatus === 'playing'
              && cell === STONE.EMPTY && !isForbid;
            // 화점 (별점): 천원·화점 위치
            const starPoints = [[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]];
            const isStar = cell === STONE.EMPTY && starPoints.some(([sr,sc]) => sr===r && sc===c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => game.placeStone(r, c)}
                style={{
                  width: cellSize, height: cellSize,
                  position: 'relative',
                  cursor: canPlace ? 'pointer' : 'default',
                }}
              >
                {/* 가로선: 셀 수직 중앙을 관통, 끝 열에서 절반만 */}
                <div style={{
                  position: 'absolute',
                  top: '50%', height: 1,
                  left:  c === 0  ? '50%' : 0,
                  right: c === 14 ? '50%' : 0,
                  background: '#5a3e1b',
                  pointerEvents: 'none',
                }} />
                {/* 세로선: 셀 수평 중앙을 관통, 끝 행에서 절반만 */}
                <div style={{
                  position: 'absolute',
                  left: '50%', width: 1,
                  top:    r === 0  ? '50%' : 0,
                  bottom: r === 14 ? '50%' : 0,
                  background: '#5a3e1b',
                  pointerEvents: 'none',
                }} />
                {/* 화점 */}
                {isStar && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: '#5a3e1b',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />
                )}
                {/* 금수 표시 */}
                {isForbid && cell === STONE.EMPTY && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: cellSize - 6, height: cellSize - 6,
                    borderRadius: '50%',
                    border: '2px solid #e53935',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }} />
                )}
                {/* 돌 */}
                {cell !== STONE.EMPTY && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: cellSize - 4, height: cellSize - 4,
                    borderRadius: '50%',
                    background: cell === STONE.BLACK
                      ? 'radial-gradient(circle at 35% 35%, #666, #111)'
                      : 'radial-gradient(circle at 35% 35%, #fff, #ccc)',
                    border: cell === STONE.WHITE ? '1.5px solid #aaa' : 'none',
                    boxShadow: isLast
                      ? '0 0 0 3px rgba(220,50,50,0.8), 2px 2px 5px rgba(0,0,0,0.5)'
                      : '2px 2px 5px rgba(0,0,0,0.4)',
                    outline: isWin ? '3px solid #f9a825' : 'none',
                    zIndex: 3,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button onClick={game.undoMove} disabled={!game.canUndo}
          style={{ padding: '8px 16px', cursor: game.canUndo ? 'pointer' : 'not-allowed', opacity: game.canUndo ? 1 : 0.4 }}>
          무르기
        </button>
        <button onClick={game.restartGame} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          재시작
        </button>
        <button onClick={game.changeDifficulty} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          난이도 변경
        </button>
      </div>
    </div>
  );
}
