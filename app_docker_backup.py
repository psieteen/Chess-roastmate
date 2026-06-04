import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global RAG components
rag_ready = False
retriever = None

def init_rag():
    global rag_ready, retriever
    print("📚 Loading chess books...")
    
    try:
        from langchain.document_loaders import TextLoader, PyPDFLoader
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain.embeddings import HuggingFaceEmbeddings
        from langchain.vectorstores import Chroma
        
        all_docs = []
        books_dir = "/app/books"
        
        import glob
        for file in glob.glob(f"{books_dir}/*"):
            if file.endswith('.pdf'):
                loader = PyPDFLoader(file)
                all_docs.extend(loader.load())
                print(f"✅ Loaded PDF: {file}")
            elif file.endswith('.txt'):
                loader = TextLoader(file, encoding='utf-8')
                all_docs.extend(loader.load())
                print(f"✅ Loaded TXT: {file}")
        
        if not all_docs:
            print("⚠️ No books found! Using fallback responses.")
            return False
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(all_docs)
        
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = Chroma.from_documents(chunks, embeddings)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
        rag_ready = True
        print(f"✅ RAG ready! {len(chunks)} chunks indexed.")
        return True
        
    except Exception as e:
        print(f"❌ RAG init failed: {e}")
        return False

def get_fallback_response(move):
    move_lower = move.lower()
    if "e4" in move_lower or "d4" in move_lower:
        return "e4! Center control = winning. Capablanca taught this. 🔥"
    elif "queen" in move_lower:
        return "QUEEN early? Nimzowitsch is rolling! Develop knights first! 🚨"
    elif "knight" in move_lower and ("a" in move_lower or "h" in move_lower):
        return "Knight on rim is dim! 🐴 Tarrasch warned you! Bring to center!"
    elif "king" in move_lower and ("g" in move_lower or "c" in move_lower):
        return "YES! Castled! King safe, rooks connected. 👑"
    else:
        return "Control center, develop pieces, castle early. Every book says this. 📚"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    move = data.get('move', '')
    name = data.get('name', 'Pawn')
    
    # Try RAG if available
    if rag_ready and retriever:
        try:
            query = f"Chess advice for move {move}"
            docs = retriever.get_relevant_documents(query)
            if docs:
                context = docs[0].page_content[:300]
                return jsonify({
                    "response": f"📖 From the books: {context}...",
                    "name": name
                })
        except:
            pass
    
    # Fallback
    return jsonify({
        "response": get_fallback_response(move),
        "name": name
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "rag_ready": rag_ready})

if __name__ == '__main__':
    print("""
    ╔══════════════════════════════════════╗
    ║   ♟️  CHESS AI - Book Powered  ♞     ║
    ║                                      ║
    ║  Books in /app/books/               ║
    ║  RAG will load automatically         ║
    ╚══════════════════════════════════════╝
    """)
    init_rag()
    app.run(host='0.0.0.0', port=5001, debug=False)
