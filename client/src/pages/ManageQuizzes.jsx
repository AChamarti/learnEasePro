import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import api from '../api/http';
const blankQ=()=>({prompt:'',options:['','','',''],correctIndex:0,explanation:''});
export default function ManageQuizzes(){const {id}=useParams();
const [quizzes,setQuizzes]=useState([]),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[passMark,setPassMark]=useState(60),[questions,setQuestions]=useState([blankQ()]),[message,setMessage]=useState('');
const load=()=>api.get(`/quizzes/course/${id}`).then(r=>setQuizzes(r.data)).catch(e=>setMessage(e.response?.data?.message||'Unable to load quizzes'));
useEffect(()=>{load()},[id]);
const patch=(i,k,v)=>setQuestions(q=>q.map((x,n)=>n===i?{...x,[k]:v}:x));
const save=async e=>{e.preventDefault();
try{await api.post(`/quizzes/course/${id}`,{title,description,passMark,questions});
setTitle('');
setDescription('');
setQuestions([blankQ()]);
setMessage('Quiz created successfully.');
load()}catch(e){setMessage(e.response?.data?.message||'Unable to create quiz')}};
return <div className="page-wrap narrow"><div className="eyebrow">ASSESSMENT BUILDER</div><h1>Course quizzes</h1><p className="muted">Create multiple-choice assessments. Correct answers are only returned after a student submits.</p><form className="editor-form" onSubmit={save}><label className="field"><span>Quiz title</span><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Module 1 knowledge check"/></label><label className="field"><span>Description</span><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="field"><span>Pass mark (%)</span><input type="number" min="0" max="100" value={passMark} onChange={e=>setPassMark(Number(e.target.value))}/></label>{questions.map((q,i)=><section className="lesson-editor" key={i}><h3>Question {i+1}</h3><label className="field"><span>Question</span><textarea required value={q.prompt} onChange={e=>patch(i,'prompt',e.target.value)}/></label>{q.options.map((o,j)=><label className="field" key={j}><span>Option {j+1} {q.correctIndex===j?'· Correct answer':''}</span><input required value={o} onChange={e=>patch(i,'options',q.options.map((x,n)=>n===j?e.target.value:x))}/></label>)}<label className="field"><span>Correct option</span><select value={q.correctIndex} onChange={e=>patch(i,'correctIndex',Number(e.target.value))}>{q.options.map((_,j)=><option value={j} key={j}>Option {j+1}</option>)}</select></label><label className="field"><span>Explanation (optional)</span><input value={q.explanation} onChange={e=>patch(i,'explanation',e.target.value)}/></label><button type="button" className="text-button" onClick={()=>setQuestions(qs=>qs.length>1?qs.filter((_,n)=>n!==i):qs)}>Remove question</button></section>)}<button type="button" className="btn btn-light" onClick={()=>setQuestions(q=>[...q,blankQ()])}>Add question</button>{message&&<p className="notice">{message}</p>}<button className="btn btn-primary">Publish quiz</button></form><h2 className="section-title">Existing quizzes</h2>{quizzes.map(q=><div className="lesson-item" key={q._id}><b>{q.title}</b><span>{q.questions.length} questions · Pass {q.passMark}%</span></div>)}<Link className="btn btn-light" to={`/manage-course/${id}`}>Back to course</Link></div>}
