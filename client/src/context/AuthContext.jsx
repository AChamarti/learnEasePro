import {createContext,useContext,useMemo,useState} from 'react';import api from '../api/http';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('lep_user'))}catch{return null}});
 const save=data=>{localStorage.setItem('lep_token',data.token);localStorage.setItem('lep_user',JSON.stringify(data.user));setUser(data.user)};
 const login=async credentials=>save((await api.post('/auth/login',credentials)).data);
 const register=async values=>save((await api.post('/auth/register',values)).data);
 const logout=()=>{localStorage.removeItem('lep_token');localStorage.removeItem('lep_user');setUser(null)};
 const value=useMemo(()=>({user,login,register,logout}),[user]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext);
