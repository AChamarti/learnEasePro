import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import api from '../api/http';
export default function PaymentSuccess(){const [params]=useSearchParams();
const [message,setMessage]=useState('Payment received. We are waiting for Stripe to confirm your enrolment.');
useEffect(()=>{let cancelled=false;let tries=0;const check=async()=>{try{const sessionId=params.get('session_id');if(!sessionId){setMessage('Checkout session was not found. Check your dashboard or contact support.');return}const r=await api.get(`/payments/session/${sessionId}`);if(r.data.paid&&!cancelled)setMessage('Your enrolment is active. You can now start learning.')}catch{}if(++tries<8&&!cancelled)setTimeout(check,2500)};check();return()=>{cancelled=true}},[params]);
return <div className="page-wrap narrow"><div className="eyebrow">PAYMENT</div><h1>Thank you!</h1><p>{message}</p><p className="muted">If access does not appear within a minute, check that the Stripe webhook is configured and try refreshing your dashboard.</p><Link className="btn btn-primary" to="/dashboard">Go to my dashboard</Link></div>}
