# Backend

This folder contains the Flask backend for the AI-Powered User Manual Chatbot project.

## Running the Flask App

1. Activate the minimal virtual environment:
   - On Windows:
     ```
     .venv_minimal\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source .venv_minimal/bin/activate
     ```

2. Run the Flask app:
   ```
   python app.py
   ```

The app will be available at http://127.0.0.1:5000/ by default.

## Endpoints
- `/health` — Health check endpoint (GET) 