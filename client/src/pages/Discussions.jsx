import {useEffect,useState,useRef} from 'react';
import {useParams} from 'react-router-dom';
import {io} from 'socket.io-client';
import api from '../api/http';
export default function Discussions(){const {id}=useParams();
const [messages,setMessages]=useState([]),[body,setBody]=useState(''),[error,setError]=useState(''),[connected,setConnected]=useState(false);
const socketRef=useRef(null);
useEffect(()=>{let alive=true;api.get(`/discussions/${id}`).then(r=>{if(alive)setMessages(r.data)}).catch(e=>setError(e.response?.data?.message||'Unable to load discussion'));const socket=io(import.meta.env.VITE_SOCKET_URL||'http://localhost:5000',{auth:{token:localStorage.getItem('lep_token')}});socketRef.current=socket;socket.on('connect',()=>{setConnected(true);socket.emit('course:join',id,r=>{if(r?.error)setError(r.error)})});socket.on('disconnect',()=>setConnected(false));socket.on('connect_error',e=>setError(e.message));socket.on('course:message',m=>setMessages(old=>old.some(x=>x._id===m._id)?old:[...old,m]));return()=>{alive=false;socket.disconnect()}},[id]);
const send=e=>{e.preventDefault();
if(!body.trim())return;
socketRef.current?.emit('course:message',{courseId:id,body},r=>{if(r?.error)setError(r.error);else setBody('')})};
return <div className="page-wrap narrow"><div className="eyebrow">LEARN TOGETHER</div><h1>Course group chat</h1><p className="muted">Messages appear instantly for learners and instructors with access to this course.</p><p className="notice">{connected?'Connected · Live chat active':'Connecting to live chat…'}</p><div className="discussion-list">{messages.map(m=><article key={m._id}><b>{m.sender?.name}</b><small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.body}</p></article>)}{!messages.length&&<div className="empty-state">No messages yet. Start the conversation.</div>}</div>{error&&<p className="error">{error}</p>}<form className="message-form" onSubmit={send}><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a message…" maxLength="2000"/><button className="btn btn-primary" disabled={!connected||!body.trim()}>Send</button></form></div>}
