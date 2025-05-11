import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = 'http://127.0.0.1:5000';

function App() {
  const [section, setSection] = useState('user');
  // Admin state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [indexingStatus, setIndexingStatus] = useState('');
  const [indexingFile, setIndexingFile] = useState('');
  // User state
  const [selectedManual, setSelectedManual] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [references, setReferences] = useState([]);
  const [queryStatus, setQueryStatus] = useState('');

  // Fetch list of uploaded files
  useEffect(() => {
    if (section === 'admin' || section === 'user') {
      fetch(`${BACKEND_URL}/files`)
        .then(res => res.json())
        .then(data => setFiles(data.files || []));
    }
  }, [section, uploadStatus, indexingStatus]);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Uploaded: ${data.filename}`);
        setSelectedFile(null);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setUploadStatus('Error uploading file');
    }
  };

  // Handle indexing
  const handleIndex = async (filename) => {
    setIndexingStatus(`Indexing ${filename}...`);
    setIndexingFile(filename);
    try {
      const res = await fetch(`${BACKEND_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok) {
        setIndexingStatus(`Indexed: ${filename}`);
      } else {
        setIndexingStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setIndexingStatus('Error indexing file');
    }
    setIndexingFile('');
  };

  // Handle user query
  const handleAsk = async () => {
    if (!selectedManual || !question) return;
    setQueryStatus('Querying...');
    setAnswer('');
    setReferences([]);
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedManual, question }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnswer(data.answer);
        setReferences(data.references || []);
        setQueryStatus('');
      } else {
        setQueryStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setQueryStatus('Error querying backend');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI-Powered User Manual Chatbot</h1>
        <nav>
          <button onClick={() => setSection('user')}>User: Query Manuals</button>
          <button onClick={() => setSection('admin')}>Admin: Upload & Index</button>
        </nav>
      </header>
      <main>
        {section === 'user' && (
          <div>
            <h2>Query Existing Manuals</h2>
            <div style={{ marginBottom: '1em' }}>
              <label>
                Select Manual:
                <select value={selectedManual} onChange={e => setSelectedManual(e.target.value)}>
                  <option value="">-- Select --</option>
                  {files.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: '1em' }}>
              <input
                type="text"
                placeholder="Type your question..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                style={{ width: '60%' }}
              />
              <button onClick={handleAsk} disabled={!selectedManual || !question}>Ask</button>
            </div>
            {queryStatus && <div>{queryStatus}</div>}
            {answer && (
              <div style={{ marginTop: '1em', background: '#222', padding: '1em', borderRadius: '8px' }}>
                <strong>Answer:</strong>
                <div>{answer}</div>
                {references.length > 0 && (
                  <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#aaa' }}>
                    References: {references.map(ref => `Page ${ref.page} (sim: ${ref.similarity.toFixed(2)})`).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {section === 'admin' && (
          <div>
            <h2>Upload & Index Manuals</h2>
            <div style={{ marginBottom: '1em' }}>
              <input type="file" accept="application/pdf" onChange={handleFileChange} />
              <button onClick={handleUpload} disabled={!selectedFile}>Upload PDF</button>
              <div>{uploadStatus}</div>
            </div>
            <h3>Uploaded Manuals</h3>
            <ul>
              {files.length === 0 && <li>No manuals uploaded yet.</li>}
              {files.map((file) => (
                <li key={file}>
                  {file}
                  <button style={{ marginLeft: '1em' }} onClick={() => handleIndex(file)} disabled={indexingFile === file}>
                    {indexingFile === file ? 'Indexing...' : 'Index'}
                  </button>
                </li>
              ))}
            </ul>
            <div>{indexingStatus}</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
