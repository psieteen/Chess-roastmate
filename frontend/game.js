let game = new Chess();
let selectedRow = null;
let selectedCol = null;
let coachName = localStorage.getItem('coachName') || 'Pawn';

function updateAvatar() {
    const avatar = document.getElementById('coach-avatar');
    if (avatar) {
        avatar.innerHTML = `🧙‍♂️ ${coachName} (Current Advisor)`;
    }
}

document.getElementById('rename-btn').addEventListener('click', () => {
    const newName = prompt('Enter new coach name:', coachName);
    if (newName && newName.trim()) {
        coachName = newName.trim();
        localStorage.setItem('coachName', coachName);
        updateAvatar();
        addChatMessage('🎉', `Coach renamed to "${coachName}"!`, 'system');
    }
});

function getPieceSymbol(piece) {
    if (!piece) return '';
    const symbols = {
        'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
        'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
    };
    return symbols[piece.type];
}

function renderBoard() {
    const board = document.getElementById('chessboard');
    const position = game.board();
    board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = position[row][col];
            const piece = square ? getPieceSymbol(square) : '';
            const squareColor = (row + col) % 2 === 0 ? 'light' : 'dark';
            const squareDiv = document.createElement('div');
            squareDiv.className = `square ${squareColor}`;
            squareDiv.textContent = piece;
            squareDiv.dataset.row = row;
            squareDiv.dataset.col = col;
            squareDiv.addEventListener('click', () => onSquareClick(row, col));
            board.appendChild(squareDiv);
        }
    }
}

function onSquareClick(row, col) {
    if (selectedRow === null) {
        const piece = game.board()[row][col];
        if (piece && ((game.turn() === 'w' && piece.color === 'w') || (game.turn() === 'b' && piece.color === 'b'))) {
            clearHighlights();
            selectedRow = row;
            selectedCol = col;
            highlightSquare(row, col, 'selected');
            showValidMoves(row, col);
        }
    } else {
        const fromAlgebraic = String.fromCharCode(97 + selectedCol) + (8 - selectedRow);
        const toAlgebraic = String.fromCharCode(97 + col) + (8 - row);
        
        const move = game.move({
            from: fromAlgebraic,
            to: toAlgebraic,
            promotion: 'q'
        });
        
        if (move) {
            clearHighlights();
            selectedRow = null;
            selectedCol = null;
            renderBoard();
            
            const moveDesc = getMoveDescription(move);
            getAIResponse(moveDesc);
        } else {
            addChatMessage(coachName, "Illegal move! Try again.", "roast");
            clearHighlights();
            selectedRow = null;
            selectedCol = null;
        }
    }
}

function getMoveDescription(move) {
    const pieceNames = { 'p': 'Pawn', 'n': 'Knight', 'b': 'Bishop', 'r': 'Rook', 'q': 'Queen', 'k': 'King' };
    const piece = pieceNames[move.piece];
    return `${piece} from ${move.from} to ${move.to}`;
}

async function getAIResponse(moveDesc) {
    addChatMessage("🧠", "Thinking...", "system");
    
    try {
        const response = await fetch('http://localhost:5001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                move: moveDesc,
                fen: game.fen(),
                name: coachName,
                tone: 'brutal'
            })
        });
        
        const data = await response.json();
        
        const chatDiv = document.getElementById('chat-messages');
        const lastMsg = chatDiv.lastChild;
        if (lastMsg && lastMsg.innerText.includes('Thinking...')) {
            chatDiv.removeChild(lastMsg);
        }
        
        addChatMessage(data.name, data.response, 'lesson');
    } catch (error) {
        const chatDiv = document.getElementById('chat-messages');
        const lastMsg = chatDiv.lastChild;
        if (lastMsg && lastMsg.innerText.includes('Thinking...')) {
            chatDiv.removeChild(lastMsg);
        }
        addChatMessage("⚠️", "Backend not running. Start with: cd .. && python app.py", "system");
    }
}

function showValidMoves(row, col) {
    const fromAlgebraic = String.fromCharCode(97 + col) + (8 - row);
    const moves = game.moves({ verbose: true });
    moves.forEach(move => {
        if (move.from === fromAlgebraic) {
            const toRow = 8 - parseInt(move.to[1]);
            const toCol = move.to.charCodeAt(0) - 97;
            highlightSquare(toRow, toCol, 'valid-move');
        }
    });
}

function highlightSquare(row, col, className) {
    const squares = document.querySelectorAll('.square');
    const index = row * 8 + col;
    if (squares[index]) squares[index].classList.add(className);
}

function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.remove('selected', 'valid-move');
    });
}

function addChatMessage(speaker, text, type) {
    const chatDiv = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<strong>${speaker}:</strong> ${text}`;
    chatDiv.appendChild(msgDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

updateAvatar();
renderBoard();
addChatMessage(coachName, "Hello! I'm your chess coach. Make a move and I'll teach you!", "lesson");
