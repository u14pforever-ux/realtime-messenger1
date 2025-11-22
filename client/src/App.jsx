import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesRef = useRef();

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => console.log('connected', s.id));
    s.on('history', msgs => setMessages(msgs));
    s.on('message', msg => setMessages(prev => [...prev, msg]));
    s.on('system', data => setMessages(prev => [...prev, { id: 'sys-'+Date.now(), user: 'System', text: data.text, ts: Date.now() }]));
    s.on('presence', members => setMembers(members));
    s.on('typing', ({ user, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [user]: isTyping }));
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [user]: false }));
      }, 2000);
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  function join() {
    if (!user) return alert('Enter a display name first');
    socket.emit('join', { room, user });
  }

  function send() {
    if (!text.trim()) return;
    socket.emit('message', { text: text.trim() });
    setText('');
    if (socket) socket.emit('typing', false);
  }

  let typingTimeout;
  function onTyping(v) {
    setText(v);
    if (!socket) return;
    socket.emit('typing', true);
    window.clearTimeout(typingTimeout);
    typingTimeout = window.setTimeout(() => socket.emit('typing', false), 900);
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Rooms</h2>
        <div className="rooms">
          <button onClick={() => setRoom('general')}># general</button>
          <button onClick={() => setRoom('random')}># random</button>
          <button onClick={() => setRoom('dev')}># dev</button>
        </div>

        <h3>Profile</h3>
        <input placeholder="Display name" value={user} onChange={e => setUser(e.target.value)} />
        <div>
          <button onClick={join}>Join: {room}</button>
        </div>

        <h3>Members</h3>
        <ul>
          {members.map(m => <li key={m.id}>{m.user || 'Anon'}</li>)}
        </ul>
      </div>

      <div className="chat">
        <header>
          <h2>{room}</h2>
          <div className="typing">
            {Object.entries(typingUsers).filter(([u, t]) => t).map(([u]) => <span key={u}>{u} is typing…</span>)}
          </div>
        </header>

        <div className="messages" ref={messagesRef}>
          {messages.map(m => (
            <div key={m.id} className={`message ${m.user === user ? 'me' : ''}`}>
              <div className="meta"><strong>{m.user}</strong> <small>{new Date(m.ts).toLocaleTimeString()}</small></div>
              <div className="text">{m.text}</div>
            </div>
          ))}
        </div>

        <footer>
          <input
            placeholder="Type a message"
            value={text}
            onChange={e => onTyping(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
          />
          <button onClick={send}>Send</button>
        </footer>
      </div>
    </div>
  );
}
