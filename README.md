# AI-Powered User Manual Chatbot

## Overview

AI-Powered User Manual Chatbot is a web-based chat application that enables users to interact with software user manuals (PDFs) using natural language. Leveraging OpenAI models, the system answers user questions based on the content of one or more uploaded manuals, providing instant, context-aware responses and referencing relevant sections of the manual.

## Features

- **PDF Upload & Management:** Upload, list, and manage one or more PDF manuals.
- **PDF Parsing & Indexing:** Extracts and splits text from PDFs, generates vector embeddings, and stores them for efficient retrieval.
- **Chat Interface:** Real-time web-based chat UI for asking questions and receiving answers.
- **Question Answering:** Uses semantic search and OpenAI models to provide concise, accurate, and referenced answers.
- **Scalable & Secure:** Designed to handle large manuals and multiple users, with secure file uploads and input sanitization.

## User Stories

- As a user, I want to upload a PDF manual so that I can ask questions about it.
- As a user, I want to ask questions in a chat interface so I can quickly find information.
- As a user, I want answers to reference the relevant section or page of the manual.
- As a user, I want to upload multiple manuals and search across them.

## Technology Stack

- **Frontend:** React or Vue.js (for chat UI and file management)
- **Backend:** FastAPI or Flask (for API endpoints)
- **PDF Parsing:** PyMuPDF or pdfplumber
- **Vector Database:** FAISS, Chroma, or Pinecone
- **OpenAI API:** For embeddings and chat completions
- **Deployment:** Docker, Vercel, or Heroku

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Set up Python environment:**
   - Requires Python 3.13 or higher.
   - (Optional) Create a virtual environment:
     ```bash
     python -m venv .venv
     source .venv/bin/activate  # On Windows: .venv\Scripts\activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: Add dependencies to `pyproject.toml` as needed.)*

4. **Run the application:**
   ```bash
   python main.py
   ```

## Usage

- Upload one or more PDF manuals via the web interface.
- Ask questions in the chat interface.
- Receive instant, referenced answers based on the uploaded manuals.

## Non-Functional Requirements

- **Performance:** Answers returned within 2-5 seconds.
- **Scalability:** Supports large manuals and multiple users.
- **Security:** Secure file uploads and API key management.
- **Reliability:** Handles parsing errors gracefully.

## Out of Scope (for MVP)

- Non-PDF formats (e.g., DOCX, HTML)
- Multi-language support
- Deep analytics and admin dashboard

## License

This project is licensed under the MIT License.  
Copyright (c) 2025 Amitvikram Dutta

## Contact

For questions or contributions, please contact Amitvikram Dutta.
