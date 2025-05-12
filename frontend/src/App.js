import React, { useState, useEffect, useRef } from 'react';
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
  const [queryStatus, setQueryStatus] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // [{question, answer, references}]
  const chatEndRef = useRef(null);

  // Fetch list of uploaded files
  useEffect(() => {
    if (section === 'admin' || section === 'user') {
      fetch(`${BACKEND_URL}/files`)
        .then(res => res.json())
        .then(data => setFiles(data.files || []));
    }
  }, [section, uploadStatus, indexingStatus]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (chatHistory.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

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
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedManual, question }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [
          ...prev,
          {
            question,
            answer: data.answer,
            references: data.references || []
          }
        ]);
        setQueryStatus('');
        setQuestion('');
      } else {
        setQueryStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setQueryStatus('Error querying backend');
    }
  };

  useEffect(() => {
    if (section === 'user') {
      document.title = 'AVD Consulting';
    } else if (section === 'admin') {
      document.title = 'AVD Consulting';
    } else {
      document.title = 'AVD Consulting';
    }
  }, [section]);

  return (
    <div className="App app-layout">
      <aside className="sidebar">
        <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Logo" style={{ width: 48, height: 48, marginBottom: '1.5em', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} />
        <button className={`nav-btn${section === 'user' ? ' active' : ''}`} onClick={() => setSection('user')}>User: Query Manuals</button>
        <button className={`nav-btn${section === 'admin' ? ' active' : ''}`} onClick={() => setSection('admin')}>Admin: Upload & Index</button>
        {section === 'user' && (
          <div className="sidebar-card">
            <label>
              Select Manual:
              <select
                value={selectedManual}
                onChange={e => {
                  setSelectedManual(e.target.value);
                  setChatHistory([]);
                  setQuestion('');
                }}
              >
                <option value="">-- Select --</option>
                {files.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {section === 'admin' && (
          <div className="sidebar-card">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button className="upload-btn" onClick={handleUpload} disabled={!selectedFile}>Upload PDF</button>
            <div className="status-msg">{uploadStatus}</div>
            <h3>Uploaded Manuals</h3>
            <ul>
              {files.length === 0 && <li>No manuals uploaded yet.</li>}
              {files.map((file) => (
                <li key={file}>
                  <span className="manual-name" title={file}>{file}</span>
                  <button className="index-btn" onClick={() => handleIndex(file)} disabled={indexingFile === file}>
                    {indexingFile === file ? 'Indexing...' : 'Index'}
                  </button>
                </li>
              ))}
            </ul>
            <div className="status-msg">{indexingStatus}</div>
          </div>
        )}
        <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center', fontSize: '0.95em', color: '#b0b8c1', opacity: 0.85, paddingTop: '2em', paddingBottom: '0.5em' }}>
          Powered by OpenAI GPT-3.5
        </div>
      </aside>
      <div className="main-content">
        <main>
          {section === 'user' && (
            <div className="chat-area">
              <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '2.2em', margin: '0 0 1em 0' }}>
                Documentation Chat
              </h1>
              <h2 style={{ marginBottom: '1.2em', textAlign: 'center', fontWeight: 400, fontSize: '1.2em' }}>
                What can I help with?
              </h2>
              <button
                style={{ alignSelf: 'flex-end', marginBottom: '1em', background: '#444b5a', color: '#fff', borderRadius: '6px', padding: '0.5em 1.2em', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                onClick={() => { setChatHistory([]); setQuestion(''); }}
              >
                Start New Chat
              </button>
              <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5em', minHeight: 0 }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '1.2em' }}>
                    <div style={{ textAlign: 'right', marginBottom: '0.2em' }}>
                      <span style={{ background: '#61dafb', color: '#23272f', borderRadius: '8px', padding: '0.5em 1em', display: 'inline-block', fontWeight: 500 }}>
                        {msg.question}
                      </span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ background: '#222', color: '#fff', borderRadius: '8px', padding: '0.5em 1em', display: 'inline-block', fontWeight: 500 }}>
                        <strong>Answer:</strong> {msg.answer}
                        {msg.references && msg.references.length > 0 && (
                          <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#aaa' }}>
                            References: {msg.references.map(ref => `Page ${ref.page} (sim: ${ref.similarity.toFixed(2)})`).join(', ')}
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="ask-row">
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
                />
                <button onClick={handleAsk} disabled={!selectedManual || !question}>Ask</button>
              </div>
              {queryStatus && <div>{queryStatus}</div>}
            </div>
          )}
          {section === 'admin' && (
            <div>
              {/* Usage statistics as simple counters */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3em', marginBottom: '2.5em' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '0.3em' }}>Manuals Uploaded</div>
                  <div style={{ fontSize: '1.5em', color: '#61dafb', fontWeight: 'bold' }}>{files.length}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '0.3em' }}>Questions Asked</div>
                  <div style={{ fontSize: '1.5em', color: '#61dafb', fontWeight: 'bold', marginTop: '0.2em' }}>{chatHistory.length}</div>
                </div>
              </div>
              <h2>Admin Panel</h2>
              <p>Use the sidebar to upload and index manuals.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
