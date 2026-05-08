export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;

export const STONE = Object.freeze({ EMPTY: 0, BLACK: 1, WHITE: 2 });

export const DIFFICULTY = Object.freeze({ EASY: 'easy', NORMAL: 'normal', HARD: 'hard' });

export const AI_DEPTH = Object.freeze({ easy: 0, normal: 3, hard: 5 });

export const AI_DELAY_MS = Object.freeze({ min: 300, max: 800 });
