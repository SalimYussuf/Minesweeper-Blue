// Constants
// Add this after your existing constants
const DIFFICULTY_SETTINGS = {
    10: { name: "Easy", rows: 8, cols: 8 },
    20: { name: "Medium", rows: 12, cols: 12 },
    40: { name: "Hard", rows: 16, cols: 16 }
};

const TILE_SIZE = 30;
const MINE_SYMBOL = '💣';
const FLAG_SYMBOL = '🚩';
const UNSURE_SYMBOL = '❓';

// Game state
let board = [];
let isGameOver = false;
let tilesRevealed = 0;
let isFirstClick = true;
let timerInterval = null;
let timeElapsed = 0;
let flagsPlaced = 0;
let rows = 0; 
let cols = 0;  
let mines = 0;

// Initialize the game with the given parameters
function initGame(r, c, m) {
    rows = r;
    cols = c;
    mines = m;
    resetGameState();
    resetUI();
    createBoard();
    renderBoard();
}

// Reset the game state
function resetGameState() {
    isGameOver = false;
    tilesRevealed = 0;
    isFirstClick = true;
    timeElapsed = 0;
    flagsPlaced = 0;
    clearInterval(timerInterval);
    board = [];
}

// Reset UI elements (like timer, flags, etc.)
function resetUI() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = '0';

    const flagsPlacedElement = document.getElementById('flags-placed');
    flagsPlacedElement.textContent = '0';

    const totalMinesElement = document.getElementById('total-mines');
    totalMinesElement.textContent = mines; // Set static total mines count
}

// Create the board's logical representation
function createBoard() {
    board = Array.from({ length: rows }, () => Array.from({ length: cols }, () =>
    ({
        isMine: false,
        adjacentMines: 0,
        isRevealed: false,
        isFlagged: false,
        isUnsure: false
    }))
    );
}

// Plant mines after the first click to avoid hitting a mine on the first move
function plantMines(firstClickRow, firstClickCol) {
    let minesPlanted = 0;
    while (minesPlanted < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (isValidMinePlacement(row, col, firstClickRow, firstClickCol)) {
            board[row][col].isMine = true;
            minesPlanted++;
            incrementAdjacentMines(row, col);
        }
    }
}

// Check if the mine placement is valid (no mine and not first clicked cell)
function isValidMinePlacement(row, col, firstClickRow, firstClickCol) {
    const isCellEmpty = !board[row][col].isMine;
    const isNotFirstClickCell = row !== firstClickRow || col !== firstClickCol;
    return isCellEmpty && isNotFirstClickCell;
}

// Increment adjacent mine counts for cells surrounding a mine
function incrementAdjacentMines(row, col) {
    forEachNeighbor(row, col, (neighborRow, neighborCol) => {
        if (!board[neighborRow][neighborCol].isMine) {
            board[neighborRow][neighborCol].adjacentMines++;
        }
    });
}

// Generalized function for looping over neighboring cells
function forEachNeighbor(row, col, callback) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (isValidCell(newRow, newCol)) {
                callback(newRow, newCol);
            }
        }
    }
}

// Check if the cell is within bounds
function isValidCell(row, col) {
    const isWithinRows = row >= 0 && row < rows;
    const isWithinCols = col >= 0 && col < cols;
    return isWithinRows && isWithinCols;
}

// This will show the board on the page
function renderBoard() {
    // Create fresh board element
    const boardElement = document.getElementById('board');
    const freshBoard = boardElement.cloneNode(false);
    
    // Set up grid layout
    freshBoard.style.gridTemplateColumns = `repeat(${cols}, ${TILE_SIZE}px)`;
    
    // Generate tiles
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            freshBoard.appendChild(createTileElement(i, j));
        }
    }
    
    // Replace old board and attach new listeners
    boardElement.parentNode.replaceChild(freshBoard, boardElement);
    attachTileListeners(freshBoard);
}
// Create an individual tile element
function createTileElement(row, col) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.row = row;
    tile.dataset.col = col;
    return tile;
}

// Attach listeners for left-click and right-click mouse clics
function attachTileListeners(boardElement) {
    boardElement.addEventListener('click', (e) => handleTileClick(e));
    boardElement.addEventListener('contextmenu', (e) => handleTileRightClick(e));
}


// Handle left-click on a tile
function handleTileClick(e) {
    if (e.target.classList.contains('tile')) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        revealTile(row, col);
    }
}

// Handle right-click on a tile (flagging)
function handleTileRightClick(e) {
    e.preventDefault();
    if (e.target.classList.contains('tile')) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        flagTile(row, col);
    }
}

// Reveal a tile and handle game logic
function revealTile(row, col) {
    const tile = board[row][col];
    if (isGameOver || tile.isRevealed || tile.isFlagged) {
        return;
    }

    if (isFirstClick) {
        isFirstClick = false;
        plantMines(row, col);
        startTimer();
    }

    tile.isRevealed = true;
    tilesRevealed++;
    updateTileUI(row, col, tile);

    if (tile.isMine) {
        gameOver(false);
    } else if (tile.adjacentMines === 0) {
        revealNeighbors(row, col);
    }

    if (tilesRevealed === rows * cols - mines) {
        gameOver(true);
    }
}

// Update the tile's UI based on its state
function updateTileUI(row, col, tile) {
    const tileElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    tileElement.classList.add('tile-clicked');

    if (tile.isMine) {
        tileElement.textContent = MINE_SYMBOL;
        tileElement.classList.add('mine');
    } else if (tile.adjacentMines > 0) {
        tileElement.textContent = tile.adjacentMines;
        tileElement.classList.add(`x${tile.adjacentMines}`);
    } else {
        tileElement.textContent = '';
    }
}

// Flag or unflag a tile
function flagTile(row, col) {
    const tile = board[row][col];
    if (isGameOver || tile.isRevealed) {
        return;
    }

    if (!tile.isFlagged && !tile.isUnsure) {
        // Place flag
        tile.isFlagged = true;
        tile.isUnsure = false;
        updateFlagUI(row, col, 'flag');
        flagsPlaced++;
    } else if (tile.isFlagged) {
        // Change to unsure
        tile.isFlagged = false;
        tile.isUnsure = true;
        updateFlagUI(row, col, 'unsure');
        flagsPlaced--;
    } else {
        // Remove unsure
        tile.isFlagged = false;
        tile.isUnsure = false;
        updateFlagUI(row, col, 'none');
    }

    updateMineCount();
}

// Update the tile UI to reflect flag state
function updateFlagUI(row, col, state) {
    const tileElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    tileElement.classList.remove('flag', 'unsure');

    switch (state) {
        case 'flag':
            tileElement.textContent = FLAG_SYMBOL;
            tileElement.classList.add('flag');
            break;
        case 'unsure':
            tileElement.textContent = UNSURE_SYMBOL;
            tileElement.classList.add('unsure');
            break;
        case 'none':
            tileElement.textContent = '';
            break;
    }
}

// Reveal neighboring tiles for empty cells recursively
function revealNeighbors(row, col) {
    forEachNeighbor(row, col, (neighborRow, neighborCol) => {
        if (!board[neighborRow][neighborCol].isRevealed) {
            revealTile(neighborRow, neighborCol);
        }
    });
}

// Update the displayed mine count
function updateMineCount() {
    const flagsPlacedElement = document.getElementById('flags-placed');
    flagsPlacedElement.textContent = flagsPlaced;
}

// Start the game timer
function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = timeElapsed;
    }, 1000);
}
function handleGameOver(timeTaken, mines) {
    const difficultyName = DIFFICULTY_SETTINGS[mines].name;

    if (confirm(`Congratulations! You won on ${difficultyName} difficulty! Do you want to save your score?`)) {
        const scoreData = {
            difficulty: mines,
            difficultyName: difficultyName,  // Make sure this is being sent
            timeTaken: timeTaken,
        };

        console.log('Sending score data:', scoreData);  // Debug log

        fetch('save_score.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        })
            .then(response => response.json())
            .then(result => {
                console.log('Save result:', result);  // Debug log
                if (result.status === 'success') {
                    alert('Score saved successfully!');
                    loadLeaderboard();
                } else {
                    throw new Error(result.message || 'Failed to save score');
                }
            })
            .catch(error => {
                console.error('Error saving score:', error);
                alert('An error occurred while saving the score: ' + error.message);
            });
    }
}

function loadLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboard-body");
    const topPlayerElement = document.getElementById("top-player");
    const bestTimeElement = document.getElementById("best-time");

    fetch('get_leaderboard.php')
        .then(response => response.json())
        .then(leaderboard => {
            console.log('Received leaderboard data:', leaderboard);  // Debug log

            // Clear existing rows
            leaderboardBody.innerHTML = '';

            // Update top player info
            if (leaderboard.length > 0) {
                topPlayerElement.textContent = leaderboard[0].username;
                bestTimeElement.textContent = leaderboard[0].timeTaken;
            }

            // Populate table
            leaderboard.forEach((data, index) => {
                console.log('Row data:', data);  // Debug log
                const row = document.createElement("tr");
                row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${data.username}</td>
                        <td>${data.difficultyName || 'N/A'}</td>
                        <td>${data.timeTaken}</td>
                    `;
                leaderboardBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            leaderboardBody.innerHTML = '<tr><td colspan="5">Error loading leaderboard</td></tr>';
        });
}

// End the game, show message and reveal all mines if lost
function gameOver(isWin) {
    isGameOver = true;
    clearInterval(timerInterval);

    const difficultyName = DIFFICULTY_SETTINGS[mines].name;
    let message;

    if (isWin) {
        message = `Congratulations! You won on ${difficultyName} difficulty in ${timeElapsed} seconds!`;
    } else {
        message = `Game Over! You hit a mine on ${difficultyName} difficulty after ${timeElapsed} seconds!`;
    }
    alert(message);

    revealAllMines();
    checkAchievements(isWin);

    if (isWin) {
        handleGameOver(timeElapsed, mines);
    }
}

// Reveal all mines on the board
function revealAllMines() {
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell.isMine) {
                updateTileUI(rowIndex, colIndex, cell);
            }
        });
    });
}

// Add this function to your Game object in minesweeper.js
function checkAchievements(isWin) {
    if (isWin) {
        const difficulty = mines; // Assuming mines correspond to difficulty
        const achievements = JSON.parse(localStorage.getItem('achievements')) || {
            easy: false,
            medium: false,
            hard: false,
            noFlag: false
        };

        if (difficulty === 10) { // Easy
            achievements.easy = true;
        } else if (difficulty === 20) { // Medium
            achievements.medium = true;
        } else if (difficulty === 40) { // Hard
            achievements.hard = true;
        }

        if (flagsPlaced === 0) {
            achievements.noFlag = true;
        }

        localStorage.setItem('achievements', JSON.stringify(achievements));
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rows = parseInt(button.dataset.rows);
            const cols = parseInt(button.dataset.columns);
            const mines = parseInt(button.dataset.mines);
            initGame(rows, cols, mines);
        });
    });
});
