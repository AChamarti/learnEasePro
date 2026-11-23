import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import api from '../api/http';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('lep_user'))}catch{return null}});
 const [authLoading,setAuthLoading]=useState(Boolean(localStorage.getItem('lep_token')));
 const clearSession=()=>{localStorage.removeItem('lep_token');localStorage.removeItem('lep_user');setUser(null)};
 const save=data=>{localStorage.setItem('lep_token',data.token);localStorage.setItem('lep_user',JSON.stringify(data.user));setUser(data.user)};
 const login=async credentials=>{const data=(await api.post('/auth/login',credentials)).data;save(data);return data};
 const register=async values=>{const data=(await api.post('/auth/register',values)).data;save(data);return data};
 const logout=()=>clearSession();
 useEffect(()=>{
  const handleExpired=()=>clearSession();
  window.addEventListener('lep:session-expired',handleExpired);
  if(localStorage.getItem('lep_token')){
   api.get('/auth/me').then(({data})=>{
    setUser(data.user);
    localStorage.setItem('lep_user',JSON.stringify(data.user));
   }).catch(()=>clearSession()).finally(()=>setAuthLoading(false));
  }else{setAuthLoading(false)}
  return ()=>window.removeEventListener('lep:session-expired',handleExpired);
 },[]);
 const value=useMemo(()=>({user,login,register,logout,authLoading}),[user,authLoading]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
