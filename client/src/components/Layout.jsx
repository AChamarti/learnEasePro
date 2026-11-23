import {Link,NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {BookOpen,GraduationCap,LayoutDashboard,LogOut,ArrowLeft,House,ShieldCheck} from 'lucide-react';
import {useAuth} from '../context/AuthContext';

function getPageTitle(pathname){
  if(pathname==='/')return 'Home';
  if(pathname==='/courses')return 'Courses';
  if(pathname.startsWith('/courses/'))return 'Course details';
  if(pathname==='/dashboard')return 'Dashboard';
  if(pathname==='/admin')return 'Admin dashboard';
  if(pathname==='/manage-course')return 'Create course';
  if(pathname.startsWith('/manage-course/')&&pathname.endsWith('/quizzes'))return 'Manage quizzes';
  if(pathname.startsWith('/manage-course/'))return 'Edit course';
  if(pathname.startsWith('/learn/'))return 'Learning room';
  if(pathname.startsWith('/discussions/'))return 'Course discussion';
  if(pathname==='/payment/success')return 'Payment confirmation';
  if(pathname==='/login')return 'Log in';
  if(pathname==='/register')return 'Create account';
  if(pathname==='/forgot-password')return 'Forgot password';
  if(pathname.startsWith('/reset-password/'))return 'Reset password';
  return 'LearnEase Pro';
}

export default function Layout(){
  const {user,logout}=useAuth();
  const location=useLocation();
  const navigate=useNavigate();
  const pageTitle=getPageTitle(location.pathname);
  const isHome=location.pathname==='/';

  function goBack(){
    const historyIndex=window.history.state?.idx;
    if(typeof historyIndex==='number'&&historyIndex>0){
      navigate(-1);
      return;
    }
    navigate(user?'/dashboard':'/');
  }

  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-icon"><GraduationCap size={23}/></span>
        LearnEase <b>Pro</b>
      </Link>
      <nav>
        <NavLink to="/courses">Courses</NavLink>
        {user&&<NavLink to="/dashboard">Dashboard</NavLink>}
        {user?.role==='admin'&&<NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="top-actions">
        {user?<>
          <span className="user-pill">{user.name} · {user.role}</span>
          <button className="btn btn-light btn-small" onClick={logout}><LogOut size={15}/> Sign out</button>
        </>:<>
          <Link className="nav-login" to="/login">Log in</Link>
          <Link className="btn btn-primary btn-small" to="/register">Get started</Link>
        </>}
      </div>
    </header>

    <div className="page-navigation" aria-label="Page navigation">
      <div className="page-navigation-inner">
        <button className="page-nav-back" type="button" onClick={goBack} disabled={isHome}>
          <ArrowLeft size={16}/> Back
        </button>
        <span className="page-nav-separator">/</span>
        <Link className={isHome?'page-nav-current':'page-nav-link'} to="/">
          <House size={15}/> Home
        </Link>
        {user&&<>
          <span className="page-nav-separator">/</span>
          <Link className={location.pathname==='/dashboard'?'page-nav-current':'page-nav-link'} to="/dashboard">
            <LayoutDashboard size={15}/> Dashboard
          </Link>
        </>}
        {location.pathname!=='/'&&<>
          <span className="page-nav-separator">/</span>
          <span className="page-nav-title">{pageTitle}</span>
        </>}
      </div>
    </div>

    <main><Outlet/></main>
    <footer>© {new Date().getFullYear()} LearnEase Pro · Learn something valuable every day.</footer>
  </div>;
}
