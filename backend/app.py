from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_simple_response(move, fen):
    move_lower = move.lower()
    
    if "e4" in move_lower or "d4" in move_lower:
        return "Nice opening! Controlling the center like a boss. 📚 Center control is everything in chess!"
    
    elif "queen" in move_lower:
        return "QUEEN so early? 🚨 That's risky! Develop your knights and bishops first before bringing out the queen."
    
    elif "knight" in move_lower and ("a" in move_lower or "h" in move_lower):
        return "A knight on the rim is dim! 🐴 Knights are most powerful in the center (f3, c3, f6, c6)."
    
    else:
        return f"Interesting move! {move} changes the position. Try to control the center and develop your pieces."

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    move = data.get('move', '')
    fen = data.get('fen', '')
    name = data.get('name', 'Pawn')
    tone = data.get('tone', 'sarcastic')
    
    response_text = get_simple_response(move, fen)
    
    return jsonify({
        'response': response_text,
        'name': name
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Chess AI Backend is running!'})

if __name__ == '__main__':
    print("🚀 Chess AI Backend starting...")
    print("📍 Server running at http://localhost:5001")
    app.run(port=5001, debug=True)