import os
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OllamaEmbeddings
from langchain.vectorstores import Chroma
from langchain.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

class ChessRAGEngine:
    def __init__(self, books_dir="./books"):
        self.books_dir = books_dir
        self.vectordb = None
        self.qa_chain = None
        self.custom_name = "Pawn"  # Default name
        self.custom_tone = "sarcastic"  # Default tone
        
    def load_and_index_books(self):
        """Load all PDFs from books directory and create vector index"""
        all_documents = []
        
        for pdf_file in os.listdir(self.books_dir):
            if pdf_file.endswith('.pdf'):
                print(f"Loading {pdf_file}...")
                loader = PyPDFLoader(os.path.join(self.books_dir, pdf_file))
                documents = loader.load()
                all_documents.extend(documents)
        
        # Split into chunks for better retrieval
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_documents(all_documents)
        
        # Create embeddings and vector store
        embeddings = OllamaEmbeddings(model="mxbai-embed-large")
        self.vectordb = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory="./chess_db"
        )
        
        print(f"Indexed {len(chunks)} chunks from {len(all_documents)} pages")
        
    def setup_qa_chain(self):
        """Setup the question-answering chain with custom personality"""
        
        # Custom prompt that includes name and tone
        prompt_template = """
        You are {name}, a chess tutor with a {tone} personality.
        
        The user just made a move in chess. Based on the context from chess books below,
        provide a response that:
        1. First, briefly reacts to their move (if it's good, praise them; if bad, roast them)
        2. Then, teaches them one key lesson relevant to the position
        3. Keep it under 3 sentences unless the lesson is complex
        
        Context from chess books:
        {context}
        
        User's move/situation: {question}
        
        Your response as {name} ({tone} tone):
        """
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["name", "tone", "context", "question"]
        )
        
        llm = Ollama(model="llama3.2:3b", temperature=0.7)
        
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=self.vectordb.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": prompt}
        )
    
    def set_personality(self, name, tone):
        """Change the chatbot's name and speaking style"""
        self.custom_name = name
        self.custom_tone = tone
    
    def get_response(self, move_description, board_state):
        """Get AI response based on current move and position"""
        if not self.qa_chain:
            self.setup_qa_chain()
        
        question = f"""
        Player just played: {move_description}
        Current position: {board_state}
        What should I teach them about this move?
        """
        
        response = self.qa_chain.run({
            "query": question,
            "name": self.custom_name,
            "tone": self.custom_tone
        })
        
        return response