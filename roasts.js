// Lesson detectors – each returns { roast, lesson, betterMoves } or null

function detectMistakes(game, lastMove) {
    const moveCount = game.history().length;
    
    // RULE 1: Queen moved too early (before move 8)
    if (lastMove.piece === 'q' && moveCount < 8) {
        return {
            roast: "Bringing out the queen before your army? That's like showing up to a sword fight with a crown. You're not that important yet.",
            lesson: "In the opening, develop your knights and bishops first. The queen is powerful but vulnerable early.",
            betterMoves: ["Nf3", "Nc3", "e4", "d4"]
        };
    }
    
    // RULE 2: Moving same piece twice in opening (first 10 moves, excluding pawns)
    if (moveCount < 10 && lastMove.piece !== 'p') {
        const history = game.history({ verbose: true });
        let samePieceMoves = 0;
        for (let i = 0; i < history.length - 1; i++) {
            if (history[i].piece === lastMove.piece && history[i].from === lastMove.from) {
                samePieceMoves++;
            }
        }
        if (samePieceMoves >= 1) {
            return {
                roast: "You just moved the same piece twice in the opening. That's illegal in the 'Book of Common Sense Chess.'",
                lesson: "Develop each piece once before moving any a second time, unless you're capturing or defending a threat.",
                betterMoves: ["Develop a knight", "Move a pawn to control center"]
            };
        }
    }
    
    // RULE 3: Knight on rim (a or h file) in first 15 moves
    if (lastMove.piece === 'n') {
        const toFile = lastMove.to[0]; // 'a' to 'h'
        if (toFile === 'a' || toFile === 'h') {
            return {
                roast: "A knight on the rim is dim. And yours is practically on vacation at the edge of the world.",
                lesson: "Knights control up to 8 squares in the center, but only 2-4 from the edge. Keep them toward the middle.",
                betterMoves: ["Nf3", "Nc3", "Nd2", "Ne2"]
            };
        }
    }
    
    return null; // no mistake found
}