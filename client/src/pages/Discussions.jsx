import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/http';

export default function Discussions() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get(`/discussions/${id}`)
      .then(response => { if (alive) setMessages(response.data); })
      .catch(error => setError(error.response?.data?.message || 'Unable to load discussion'));

    const token = sessionStorage.getItem('lep_token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('course:join', id, response => {
        if (response?.error) setError(response.error);
      });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', error => setError(error.message));
    socket.on('course:message', message => {
      setMessages(current => current.some(item => item._id === message._id) ? current : [...current, message]);
    });

    return () => {
      alive = false;
      socket.disconnect();
    };
  }, [id]);

  const send = event => {
    event.preventDefault();
    if (!body.trim()) return;
    socketRef.current?.emit('course:message', { courseId: id, body }, response => {
      if (response?.error) setError(response.error);
      else setBody('');
    });
  };

  return (
    <div className="page-wrap narrow">
      <div className="eyebrow">LEARN TOGETHER</div>
      <h1>Course group chat</h1>
      <p className="muted">Messages appear instantly for learners and instructors with access to this course.</p>
      <p className="notice">{connected ? 'Connected · Live chat active' : 'Connecting to live chat…'}</p>
      <div className="discussion-list">
        {messages.map(message => (
          <article key={message._id}>
            <b>{message.sender?.name}</b>
            <small>{new Date(message.createdAt).toLocaleString()}</small>
            <p>{message.body}</p>
          </article>
        ))}
        {!messages.length && <div className="empty-state">No messages yet. Start the conversation.</div>}
      </div>
      {error && <p className="error">{error}</p>}
      <form className="message-form" onSubmit={send}>
        <input value={body} onChange={event => setBody(event.target.value)} placeholder="Write a message…" maxLength="2000" />
        <button className="btn btn-primary" disabled={!connected || !body.trim()}>Send</button>
      </form>
    </div>
  );
}
