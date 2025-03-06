export const buildBoard = (width: number, height: number, bombs: number): number[][] => {
    const board = getEmptyBoard(width, height);
    fillBoardWithBombs(board, width, height, bombs);
    numberBoard(board, width, height);
    return board;
}

const getEmptyBoard = (width: number, height: number): number[][] => {
    const board: number[][] = [];
    for (var i=0; i<height; i++) {
        const row: number[] = [];
        for (var j=0; j<width; j++) {
            row.push(0);
        }
        board.push(row);
    }
    return board;
}

const fillBoardWithBombs = (board: number[][], width: number, height: number, bombs: number) => {
    for (var i=0; i<bombs; i++) {
        let foundSpot = false;
        while (!foundSpot) {
            let row = Math.floor(Math.random() * height);
            let col = Math.floor(Math.random() * width);
            if (board[row][col] === 0) {
                board[row][col] = -1;
                foundSpot = true;
            }
        }
    }
}

const numberBoard = (board: number[][], width: number, height: number) => {
    for (var i=0; i<height; i++) {
        for (var j=0; j<width; j++) {
            if (board[i][j] === 0) {
                board[i][j] = getNearbyBombs(board, width, height, i, j);
            }
        }
    }
}

const BOX = [-1, 0, 1];

const getNearbyBombs = (board: number[][], width: number, height: number, row: number, col: number): number => {
    return BOX.map((y: number) => {
        return BOX.map((x: number) => {
            if (row + y > 0 && row + y < height
                && col + x > 0 && col + x < width) {
                return board[row + y][col + x];
            }
            return 0;
        }).reduce((partialSum, a) => partialSum + (a === -1 ? 1 : 0), 0);
    }).reduce((partialSum, a) => partialSum + a, 0);
}