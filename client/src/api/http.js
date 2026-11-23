import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api'});
api.interceptors.request.use(config=>{const token=localStorage.getItem('lep_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config});
export default api;

// Any rejected authenticated request clears stale credentials.
api.interceptors.response.use(response=>response,error=>{
  if(error.response?.status===401){
    window.dispatchEvent(new Event('lep:session-expired'));
  }
  return Promise.reject(error);
});
