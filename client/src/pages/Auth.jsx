import {useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {GraduationCap} from 'lucide-react';
import api from '../api/http';
import {useAuth} from '../context/AuthContext';
export function Login(){const {login}=useAuth(),nav=useNavigate();
const [form,setForm]=useState({email:'',password:''}),[error,setError]=useState('');
const submit=async e=>{e.preventDefault();
setError('');
try{await login(form);
nav('/dashboard')}catch(err){setError(err.response?.data?.message||'Unable to log in')}};
return <AuthFrame title="Welcome back" subtitle="Pick up where your learning journey left off."><form onSubmit={submit}><Field label="Email address" type="email" value={form.email} onChange={v=>setForm({...form,email:v})}/><Field label="Password" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/><div className="form-between"><span/><Link to="/forgot-password">Forgot password?</Link></div>{error&&<p className="error">{error}</p>}<button className="btn btn-primary btn-full">Log in</button></form><p className="auth-foot">New to LearnEase? <Link to="/register">Create an account</Link></p></AuthFrame>}
export function Register(){const {register}=useAuth(),nav=useNavigate();
const [form,setForm]=useState({name:'',email:'',password:'',role:'student'}),[error,setError]=useState('');
const submit=async e=>{e.preventDefault();
setError('');
try{await register(form);
nav('/dashboard')}catch(err){setError(err.response?.data?.message||'Unable to register')}};
return <AuthFrame title="Create your account" subtitle="Start learning or share your expertise."><form onSubmit={submit}><Field label="Full name" value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Email address" type="email" value={form.email} onChange={v=>setForm({...form,email:v})}/><Field label="Password (8+ characters)" type="password" value={form.password} onChange={v=>setForm({...form,password:v})}/><label className="field"><span>I want to join as</span><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="student">Student</option><option value="instructor">Instructor</option></select></label>{error&&<p className="error">{error}</p>}<button className="btn btn-primary btn-full">Create account</button></form><p className="auth-foot">Already registered? <Link to="/login">Log in</Link></p></AuthFrame>}
export function ForgotPassword(){const [email,setEmail]=useState(''),[message,setMessage]=useState('');
const submit=async e=>{e.preventDefault();
try{const r=await api.post('/auth/forgot-password',{email});
setMessage(r.data.message)}catch{setMessage('Could not submit request. Try again.')}};
return <AuthFrame title="Reset your password" subtitle="We'll send a reset link if an account matches your email."><form onSubmit={submit}><Field label="Email address" type="email" value={email} onChange={setEmail}/><button className="btn btn-primary btn-full">Send reset link</button>{message&&<p className="success">{message}</p>}</form><p className="auth-foot"><Link to="/login">Back to login</Link></p></AuthFrame>}
export function ResetPassword(){const {token}=useParams(),nav=useNavigate();
const [password,setPassword]=useState(''),[message,setMessage]=useState('');
const submit=async e=>{e.preventDefault();
try{const r=await api.post(`/auth/reset-password/${token}`,{password});
setMessage(r.data.message);
setTimeout(()=>nav('/login'),1500)}catch(err){setMessage(err.response?.data?.message||'Unable to reset password')}};
return <AuthFrame title="Choose a new password" subtitle="Use at least eight characters."><form onSubmit={submit}><Field label="New password" type="password" value={password} onChange={setPassword}/><button className="btn btn-primary btn-full">Update password</button>{message&&<p className="success">{message}</p>}</form></AuthFrame>}
function AuthFrame({title,subtitle,children}){return <div className="auth-page"><div className="auth-card"><Link className="brand auth-brand" to="/"><span className="brand-icon"><GraduationCap/></span>LearnEase <b>Pro</b></Link><h2>{title}</h2><p>{subtitle}</p>{children}</div></div>}
function Field({label,type='text',value,onChange}){return <label className="field"><span>{label}</span><input required type={type} value={value} onChange={e=>onChange(e.target.value)}/></label>}
