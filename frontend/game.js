// game.js - Chess with AI Tutor

let game = new Chess();
let selectedRow = null;
let selectedCol = null;
let isAIThinking = false;

// Get piece symbol for display
function getPieceSymbol(piece) {
    if (!piece) return '';
    const symbols = {
        'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
        'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
    };
    return symbols[piece.type];
}

// Render chessboard
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

// Get coach name from settings (temporary - will add UI later)
function getCoachName() {
    return localStorage.getItem('coachName') || 'Pawn';
}

// Get coach tone from settings
function getCoachTone() {
    return localStorage.getItem('coachTone') || 'sarcastic';
}

// Call AI backend for response
async function getAIResponse(moveDescription, fen) {
    if (isAIThinking) return null;
    
    isAIThinking = true;
    addChatMessage("🧠 AI", "Thinking...", "system");
    
    try {
        const response = await fetch('http://localhost:5001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                move: moveDescription,
                fen: fen,
                name: getCoachName(),
                tone: getCoachTone()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove the "Thinking..." message
        const chatDiv = document.getElementById('chat-messages');
        const lastMsg = chatDiv.lastChild;
        if (lastMsg && lastMsg.innerText.includes("Thinking...")) {
            chatDiv.removeChild(lastMsg);
        }
        
        addChatMessage(data.name, data.response, 'ai-response');
        return data.response;
        
    } catch (error) {
        console.error('AI Error:', error);
        // Remove the "Thinking..." message
        const chatDiv = document.getElementById('chat-messages');
        const lastMsg = chatDiv.lastChild;
        if (lastMsg && lastMsg.innerText.includes("Thinking...")) {
            chatDiv.removeChild(lastMsg);
        }
        addChatMessage("⚠️ System", "AI backend not running. Start with: cd backend && python app.py", "system");
        return null;
    } finally {
        isAIThinking = false;
    }
}

// Convert move to readable description
function getMoveDescription(move) {
    const pieceNames = {
        'p': 'Pawn', 'n': 'Knight', 'b': 'Bishop', 'r': 'Rook', 'q': 'Queen', 'k': 'King'
    };
    const piece = pieceNames[move.piece] || 'Piece';
    const from = move.from;
    const to = move.to;
    
    let description = `${piece} from ${from} to ${to}`;
    if (move.captured) {
        description += ` capturing ${pieceNames[move.captured] || 'piece'}`;
    }
    if (move.promotion) {
        description += ` promoting to ${pieceNames[move.promotion]}`;
    }
    return description;
}

// Handle square click
function onSquareClick(row, col) {
    if (selectedRow === null) {
        // Select piece
        const piece = game.board()[row][col];
        if (piece && ((game.turn() === 'w' && piece.color === 'w') || (game.turn() === 'b' && piece.color === 'b'))) {
            clearHighlights();
            selectedRow = row;
            selectedCol = col;
            highlightSquare(row, col, 'selected');
            showValidMoves(row, col);
        }
    } else {
        // Attempt move
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
            
            // Get AI response for the move
            const moveDesc = getMoveDescription(move);
            const fen = game.fen();
            getAIResponse(moveDesc, fen);
            
        } else {
            addChatMessage(getCoachName(), "Illegal move! Try again.", "roast");
            clearHighlights();
            selectedRow = null;
            selectedCol = null;
        }
    }
}

// Show valid moves for selected piece
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
    if (squares[index]) {
        squares[index].classList.add(className);
    }
}

function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.remove('selected', 'valid-move');
    });
}

// Add message to chat panel
function addChatMessage(speaker, text, type) {
    const chatDiv = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    
    let typeClass = 'system';
    if (type === 'roast') typeClass = 'roast';
    if (type === 'lesson') typeClass = 'lesson';
    if (type === 'ai-response') typeClass = 'lesson';
    
    msgDiv.className = `message ${typeClass}`;
    msgDiv.innerHTML = `<strong>${speaker}:</strong> ${text}`;
    chatDiv.appendChild(msgDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Add name customization (temporary popup)
function setupNameCustomization() {
    const savedName = localStorage.getItem('coachName');
    if (!savedName) {
        setTimeout(() => {
            const name = prompt("Name your chess coach:", "Pawn");
            if (name) {
                localStorage.setItem('coachName', name);
                addChatMessage("🎉", `Your coach is now named "${name}"!`, "system");
            }
        }, 1000);
    }
    
    // Add name change button in chat header (optional)
    const avatar = document.querySelector('.personality-avatar');
    if (avatar) {
        avatar.style.cursor = 'pointer';
        avatar.title = 'Click to rename coach';
        avatar.onclick = () => {
            const newName = prompt("Enter new coach name:", getCoachName());
            if (newName && newName.trim()) {
                localStorage.setItem('coachName', newName.trim());
                addChatMessage("🎉", `Coach renamed to "${newName.trim()}"!`, "system");
                avatar.innerHTML = `🧙‍♂️ ${newName.trim()} (Current Advisor)`;
            }
        };
        
        // Update avatar with saved name
        avatar.innerHTML = `🧙‍♂️ ${getCoachName()} (Current Advisor)`;
    }
}

// Initialize
renderBoard();
setupNameCustomization();

// Welcome message
setTimeout(() => {
    addChatMessage(getCoachName(), `Hello! I'm your chess coach. Make a move and I'll teach you from the chess books.`, "ai-response");
}, 500);