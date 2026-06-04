FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    langchain \
    langchain-community \
    chromadb \
    pypdf \
    sentence-transformers \
    ollama

# Copy application
COPY app.py .

# Create books directory
RUN mkdir -p /app/books

# Expose port
EXPOSE 5001

# Run
CMD ["python", "app.py"]
