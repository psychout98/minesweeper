export interface Board {
    started: boolean;
    spaces: Space[][];
}

export interface Space {
    y: number;
    x: number;
    value: number;
    hidden: boolean;
    flagged: boolean;
}

export enum Action {
  REVEAL,
  FLAG
}

export interface Event {
    space: Space;
    action: Action;
}

const BOX = [-1, 0, 1];

export const getEmptyBoard = (width: number, height: number): Space[][] => {
    const board: Space[][] = [];
    for (let i=0; i<height; i++) {
        const row: Space[] = [];
        for (let j=0; j<width; j++) {
            row.push({y: i, x: j, value: 0, hidden: true, flagged: false});
        }
        board.push(row);
    }
    return board;
}

export const revealAll = (spaces: Space[][]): Space[][] => {
    return spaces.map(row => row.map(space => {
        return {
            ...space,
            hidden: false
        }
    }));
}

export const getFlags = (board: Space[][]) => {
    return board.map(row => row.map(space => ((space.value === -1 ? 1 : 0) + (space.flagged ? -1 : 0)) as number)
    .reduce((partialSum, a) => partialSum + a, 0))
    .reduce((partialSum, a) => partialSum + a, 0);
}

export const cascadeReveal = (board: Space[][], row: number, col: number) => {
    board[row][col].hidden = false;
    if (board[row][col].value === 0) {
        BOX.forEach(y => {
            BOX.forEach(x => {
                if (row + y >= 0 && row + y < board.length
                    && col + x >= 0 && col + x < board[0].length
                    && board[row + y][col + x].hidden) {
                    cascadeReveal(board, row + y, col + x);
                }
            });
        });
    }
}

export const solved = (board: Space[][]): boolean => {
    for (let i=0; i<board.length; i++) {
        for (let j=0; j<board[0].length; j++) {
            if (board[i][j].hidden) {
                if (board[i][j].value === -1) {
                    if (!board[i][j].flagged) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (board[i][j].value === -1) {
                return false;
            }
        }
    }
    return true;
}

export const actionEvent = (event: Event, board: Board) => {
    const space = event.space;
    const row = space.y;
    const col = space.x;
    const currentSpace = board.spaces[row][col];
    if (space.hidden === currentSpace.hidden && space.flagged === currentSpace.flagged) {
        if (event.action === Action.REVEAL && currentSpace.hidden && !currentSpace.flagged) {
            if (board.started) {
                if (currentSpace.value === -1) {
                    revealAll(board.spaces);
                } else if (currentSpace.value === 0) {
                    cascadeReveal(board.spaces, row, col);
                } else {
                    currentSpace.hidden = false;
                }
            }
        }
        if (event.action === Action.FLAG) {
            currentSpace.flagged = !currentSpace.flagged;
        }
    }
}