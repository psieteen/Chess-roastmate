let game = new Chess();
let selectedRow = null;
let selectedCol = null;
let currentPersonality = "pawn";

// Piece Unicode mapping
const pieceMap = {
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
};

function renderBoard() {
    const board = document.getElementById('chessboard');
    const position = game.board();
    board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = position[row][col];
            const piece = square ? pieceMap[square.type] : '';
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
        // Select piece if it exists and belongs to current turn
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
        const from = { row: selectedRow, col: selectedCol };
        const to = { row, col };
        const fromAlgebraic = String.fromCharCode(97 + from.col) + (8 - from.row);
        const toAlgebraic = String.fromCharCode(97 + to.col) + (8 - to.row);
        
        try {
            const move = game.move({
                from: fromAlgebraic,
                to: toAlgebraic,
                promotion: 'q'
            });
            
            if (move) {
                // Move successful
                clearHighlights();
                selectedRow = null;
                selectedCol = null;
                renderBoard();
                
                // Check move quality
                const feedback = evaluateOpeningMove(game, move);
                if (feedback) {
                    displayFeedback(feedback);
                }
            } else {
                // Illegal move
                addChatMessage("Pawn", "Illegal move. Are you even trying?", "roast");
                clearHighlights();
                selectedRow = null;
                selectedCol = null;
            }
        } catch(e) {
            clearHighlights();
            selectedRow = null;
            selectedCol = null;
        }
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
    squares[index].classList.add(className);
}

function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.remove('selected', 'valid-move');
    });
}

function addChatMessage(speaker, text, type = "roast") {
    const chatDiv = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<strong>${speaker}:</strong> ${text}`;
    chatDiv.appendChild(msgDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function displayFeedback(feedback) {
    if (!feedback) return;
    
    // Different styling based on move quality
    let messageType = "roast";
    if (feedback.type === "good") messageType = "lesson";
    if (feedback.type === "average") messageType = "system";
    
    addChatMessage(currentPersonality.toUpperCase(), feedback.roast, messageType);
    
    // Only show lesson for bad/average moves
    if (feedback.type !== "good" && feedback.lesson) {
        addChatMessage("📘 Lesson", feedback.lesson, "lesson");
    }
    
    if (feedback.betterMoves && feedback.betterMoves.length > 0) {
        addChatMessage("💡 Suggestion", "Try: " + feedback.betterMoves.join(" or "), "lesson");
    }
}

function evaluateOpeningMove(game, lastMove) {
    const moveCount = game.history().length;
    
    // Only evaluate first 12 moves
    if (moveCount > 12) return null;
    
    // --- BAD MOVES (Score: 0-40) ---
    
    // 1. Queen moved too early (before move 6)
    if (lastMove.piece === 'q' && moveCount <= 6) {
        return {
            type: "bad",
            roast: "QUEEN? Already? You're like a toddler grabbing the crown jewels. Develop your knights first!",
            lesson: "Bringing the queen out early lets opponents attack her while developing their own pieces.",
            betterMoves: ["Nf3", "Nc3", "e4", "d4"]
        };
    }
    
    // 2. Knight on rim in first 10 moves
    if (lastMove.piece === 'n' && moveCount <= 10) {
        const toFile = lastMove.to[0];
        if (toFile === 'a' || toFile === 'h') {
            return {
                type: "bad",
                roast: "A knight on the rim is dim! Your horse is looking at the audience instead of the battle.",
                lesson: "From the center, a knight attacks 8 squares. From the edge, only 2-4. Bring it in!",
                betterMoves: ["Nf3", "Nc3", "Nd2", "Ne2"]
            };
        }
    }
    
    // 3. Moving same piece twice in first 8 moves (excluding pawns)
    if (moveCount <= 8 && lastMove.piece !== 'p') {
        const history = game.history({ verbose: true });
        let moveCountForThisPiece = 0;
        for (let i = 0; i < history.length; i++) {
            if (history[i].piece === lastMove.piece && history[i].from === lastMove.from) {
                moveCountForThisPiece++;
            }
        }
        if (moveCountForThisPiece >= 2) {
            return {
                type: "bad",
                roast: "You moved the same piece twice in the opening. That's like putting on your left shoe, then taking it off, then putting it on again.",
                lesson: "Develop each piece once before moving any a second time. Get all your pieces into the game!",
                betterMoves: ["Develop a knight", "Move a pawn", "Castle"]
            };
        }
    }
    
    // 4. Bishop trapped behind pawns
    if (lastMove.piece === 'b') {
        const toRow = lastMove.to[1];
        if (toRow === '1' || toRow === '8') {
            return {
                type: "bad",
                roast: "Your bishop is still hiding behind pawns like a scared child. Let it breathe!",
                lesson: "Bishops need open diagonals. Move your center pawns to free them.",
                betterMoves: ["e4", "d4", "Nf3", "Nc3"]
            };
        }
    }
    
    // --- AVERAGE MOVES (Score: 41-70) ---
    
    // 5. Pawn move but not controlling center
    if (lastMove.piece === 'p') {
        const toCol = lastMove.to[0];
        const centerCols = ['d', 'e'];
        if (!centerCols.includes(toCol)) {
            return {
                type: "average",
                roast: "A flank pawn move? Bold. But the center is where the party's at.",
                lesson: "Controlling the center (e4, d4, e5, d5) gives your pieces more space and options.",
                betterMoves: ["e4", "d4", "e5", "d5"]
            };
        }
    }
    
    // 6. Knight development but to passive square
    if (lastMove.piece === 'n') {
        const toFile = lastMove.to[0];
        const toRow = lastMove.to[1];
        if ((toFile === 'd' || toFile === 'e') && (toRow === '2' || toRow === '7')) {
            return {
                type: "average",
                roast: "Decent. But your knight looks shy hiding behind the pawns.",
                lesson: "Knights are most powerful on f3, c3, f6, or c6 — attacking the center.",
                betterMoves: ["Nf3", "Nc3", "Nf6", "Nc6"]
            };
        }
    }
    
    // --- GOOD MOVES (Score: 71-100) ---
    
    // 7. Excellent center control (e4, d4, e5, d5)
    if (lastMove.piece === 'p') {
        const toCol = lastMove.to[0];
        if (toCol === 'e' || toCol === 'd') {
            const openingMessages = [
                "Nice opening, baby! Controlling the center like a boss.",
                "Now THAT'S how you start a game. Center control = chess happiness.",
                "Beautiful. The center is yours. What's your next move, grandmaster?",
                "Solid. You've studied well. That's a textbook opening move."
            ];
            return {
                type: "good",
                roast: openingMessages[Math.floor(Math.random() * openingMessages.length)],
                lesson: "",
                betterMoves: []
            };
        }
    }
    
    // 8. Knight to f3/c3/f6/c6 (excellent development)
    if (lastMove.piece === 'n') {
        const toAlgebraic = lastMove.to;
        if (toAlgebraic === 'f3' || toAlgebraic === 'c3' || toAlgebraic === 'f6' || toAlgebraic === 'c6') {
            const goodMessages = [
                "Perfect knight development! That's how legends are made.",
                "Textbook move. Your knight is ready for action.",
                "Ah, a classical development. Bobby Fischer would approve.",
                "Strong move! That knight controls beautiful squares."
            ];
            return {
                type: "good",
                roast: goodMessages[Math.floor(Math.random() * goodMessages.length)],
                lesson: "",
                betterMoves: []
            };
        }
    }
    
    // 9. Castling (always good)
    if (lastMove.piece === 'k' && Math.abs(lastMove.from.charCodeAt(0) - lastMove.to.charCodeAt(0)) === 2) {
        const castleMessages = [
            "Castled! Now your king is safe. You're learning!",
            "Safety first! Beautiful castle.",
            "The king tucks in. Now bring the attack!"
        ];
        return {
            type: "good",
            roast: castleMessages[Math.floor(Math.random() * castleMessages.length)],
            lesson: "",
            betterMoves: []
        };
    }
    
    // Default: no specific feedback
    return null;
}

// Initial render
renderBoard();