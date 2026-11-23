import {Navigate,Outlet} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
export default function ProtectedRoute({roles}){
 const {user,authLoading}=useAuth();
 if(authLoading)return <div className="page-wrap"><p>Checking your session...</p></div>;
 if(!user)return <Navigate to="/login" replace/>;
 if(roles&&!roles.includes(user.role))return <Navigate to="/dashboard" replace/>;
 return <Outlet/>;
}
