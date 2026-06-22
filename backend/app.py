from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

RESPONSES = {
    "center": [
        "e4! 🔥 Center control! Capablanca taught this.",
        "Beautiful center pawn! Now develop those knights.",
        "That's how you start a game! Bobby Fischer approves."
    ],
    "queen_early": [
        "QUEEN on move 2?? 🚨 Nimzowitsch is rolling in his grave! Knights first!",
        "Too early for queen! Every chess book says: develop minor pieces.",
        "Your queen will get chased! Bring out knights and bishops first."
    ],
    "knight_rim": [
        "Knight on rim is dim! 🐴 Tarrasch warned you! Bring to center!",
        "That horse controls 2 squares instead of 8. Move to f3/c3!",
        "Knights belong in the center, not on vacation at the edge!"
    ],
    "castling": [
        "YES! 👑 You castled! King safe, rooks connected!",
        "Finally! This is called 'not being an idiot'. Well done!",
        "Castling! Now the real chess begins."
    ],
    "default": [
        "Control the center. Develop pieces. Castle early. That's chess. 📚",
        "Questionable move. Try e4 or d4 next time?",
        "Every chess book says: center control first. That move? Not center."
    ]
}

def get_response(move):
    m = move.lower()
    if "e4" in m or "d4" in m:
        return random.choice(RESPONSES["center"])
    elif "queen" in m:
        return random.choice(RESPONSES["queen_early"])
    elif "knight" in m and ("a" in m or "h" in m):
        return random.choice(RESPONSES["knight_rim"])
    elif "king" in m and ("g" in m or "c" in m):
        return random.choice(RESPONSES["castling"])
    else:
        return random.choice(RESPONSES["default"])

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    move = data.get('move', '')
    name = data.get('name', 'Pawn')
    return jsonify({"response": get_response(move), "name": name})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Chess backend is running!"})

if __name__ == '__main__':
    print("""
    ╔════════════════════════════════════════╗
    ║   ♟️  Chess Backend Running!  ♞        ║
    ║   http://localhost:5001               ║
    ║   Make a move and get roasted!        ║
    ╚════════════════════════════════════════╝
    """)
    app.run(port=5001, debug=True)
