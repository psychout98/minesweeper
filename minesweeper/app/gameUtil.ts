export interface Space {
    y: number,
    x: number,
    value: number,
    hidden: boolean,
    flagged: boolean
}

export const buildMinefield = (board: Space[][], bombs: number, firstSpace: Space) => {
    fillBoardWithBombs(board, bombs, firstSpace);
    numberBoard(board);
}

export const getEmptyBoard = (width: number, height: number): Space[][] => {
    const board: Space[][] = [];
    for (var i=0; i<height; i++) {
        const row: Space[] = [];
        for (var j=0; j<width; j++) {
            row.push({y: i, x: j, value: 0, hidden: true, flagged: false});
        }
        board.push(row);
    }
    return board;
}

const fillBoardWithBombs = (board: Space[][], bombs: number, firstSpace: Space) => {
    for (var i=0; i<bombs; i++) {
        let foundSpot = false;
        while (!foundSpot) {
            let row = Math.floor(Math.random() * board.length);
            let col = Math.floor(Math.random() * board[0].length);
            if (board[row][col].value === 0 && !nearFirstSpace(row, col, firstSpace)) {
                board[row][col].value = -1;
                foundSpot = true;
            }
        }
    }
}

export const BOX = [-1, 0, 1];

const nearFirstSpace = (row: number, col: number, firstSpace: Space): boolean => {
    for (const y of BOX) {
        for (const x of BOX) {
            if (row === firstSpace.y + y && col === firstSpace.x + x) {
                return true;
            } 
        }
    }

    return false;
}

const numberBoard = (board: Space[][]) => {
    for (var i=0; i<board.length; i++) {
        for (var j=0; j<board[0].length; j++) {
            if (board[i][j].value === 0) {
                board[i][j].value = getNearbyBombs(board, i, j);
            }
        }
    }
}

const getNearbyBombs = (board: Space[][], row: number, col: number): number => {
    return BOX.map(y => {
        return BOX.map(x => {
            if (row + y >= 0 && row + y < board.length
                && col + x >= 0 && col + x < board[0].length) {
                return board[row + y][col + x].value;
            }
            return 0;
        }).reduce((partialSum, a) => partialSum + (a === -1 ? 1 : 0), 0);
    }).reduce((partialSum, a) => partialSum + a, 0);
}

export const getBombs = (board: Space[][]) => {
    return board.map(row => row.map(col => (col.value === -1 ? 1 : col.flagged ? -1 : 0) as number)
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