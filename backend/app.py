from flask import Flask, jsonify, request
import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
from dotenv import load_dotenv
import openai
import json
import numpy as np
from flask_cors import CORS

# Load environment variables from secrets/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'secrets', '.env'))
openai.api_key = os.environ.get('OPENAI_API_KEY')

app = Flask(__name__)
CORS(app)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Set tesseract path for Windows if needed
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    save_path = os.path.join(DATA_DIR, file.filename)
    file.save(save_path)
    return jsonify({'status': 'success', 'filename': file.filename}), 200

@app.route('/files', methods=['GET'])
def list_files():
    files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.pdf')]
    return jsonify({'files': files}), 200

@app.route('/parse', methods=['POST'])
def parse_pdf():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    try:
        doc = fitz.open(file_path)
        text_pages = [page.get_text() for page in doc]
        text = "\n".join(text_pages)
        # If text is mostly blank, use OCR
        if not text.strip() or len(text.strip()) < 20:
            ocr_text_pages = []
            for page in doc:
                pix = page.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes()))
                ocr_text = pytesseract.image_to_string(img)
                ocr_text_pages.append(ocr_text)
            text = "\n".join(ocr_text_pages)
        doc.close()
        return jsonify({'filename': filename, 'text': text}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/index', methods=['POST'])
def index_pdf():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    try:
        doc = fitz.open(file_path)
        chunks = []
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                chunks.append({'page': page_num + 1, 'text': text})
        doc.close()
        # Generate real embeddings for each chunk using OpenAI
        for chunk in chunks:
            response = openai.embeddings.create(
                input=chunk['text'],
                model="text-embedding-3-small"
            )
            chunk['embedding'] = response.data[0].embedding
        # Store the chunks and embeddings in a JSON file
        out_path = os.path.join(DATA_DIR, f"{filename}_embeddings.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump({'filename': filename, 'chunks': chunks}, f)
        return jsonify({'filename': filename, 'chunks': chunks}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def semantic_search():
    data = request.get_json()
    filename = data.get('filename')
    query = data.get('query')
    if not filename or not query:
        return jsonify({'error': 'Filename and query are required'}), 400
    emb_path = os.path.join(DATA_DIR, f"{filename}_embeddings.json")
    if not os.path.exists(emb_path):
        return jsonify({'error': 'Embeddings file not found. Please index the PDF first.'}), 404
    try:
        with open(emb_path, 'r', encoding='utf-8') as f:
            emb_data = json.load(f)
        chunks = emb_data['chunks']
        # Get query embedding
        response = openai.embeddings.create(
            input=query,
            model="text-embedding-3-small"
        )
        query_emb = np.array(response.data[0].embedding)
        # Compute cosine similarity
        results = []
        for chunk in chunks:
            chunk_emb = np.array(chunk['embedding'])
            sim = float(np.dot(query_emb, chunk_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(chunk_emb) + 1e-8))
            results.append({
                'page': chunk['page'],
                'text': chunk['text'],
                'similarity': sim
            })
        # Sort by similarity, descending
        results = sorted(results, key=lambda x: x['similarity'], reverse=True)
        return jsonify({'results': results[:3]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_qa():
    data = request.get_json()
    filename = data.get('filename')
    question = data.get('question')
    if not filename or not question:
        return jsonify({'error': 'Filename and question are required'}), 400
    emb_path = os.path.join(DATA_DIR, f"{filename}_embeddings.json")
    if not os.path.exists(emb_path):
        return jsonify({'error': 'Embeddings file not found. Please index the PDF first.'}), 404
    try:
        with open(emb_path, 'r', encoding='utf-8') as f:
            emb_data = json.load(f)
        chunks = emb_data['chunks']
        # Get question embedding
        response = openai.embeddings.create(
            input=question,
            model="text-embedding-3-small"
        )
        query_emb = np.array(response.data[0].embedding)
        # Compute cosine similarity
        results = []
        for chunk in chunks:
            chunk_emb = np.array(chunk['embedding'])
            sim = float(np.dot(query_emb, chunk_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(chunk_emb) + 1e-8))
            results.append({
                'page': chunk['page'],
                'text': chunk['text'],
                'similarity': sim
            })
        # Sort by similarity, descending, and get top 3
        top_chunks = sorted(results, key=lambda x: x['similarity'], reverse=True)[:3]
        # Build context for the prompt
        context = "\n\n".join([f"Page {c['page']}: {c['text']}" for c in top_chunks])
        prompt = (
            f"You are an AI assistant helping a user with a software manual. "
            f"Answer the following question using only the provided context. "
            f"If the answer is not in the context, say you don't know.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        )
        # Get answer from OpenAI chat/completion API
        chat_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256,
            temperature=0.2
        )
        answer = chat_response.choices[0].message.content.strip()
        return jsonify({
            'answer': answer,
            'references': [{'page': c['page'], 'similarity': c['similarity']} for c in top_chunks]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 