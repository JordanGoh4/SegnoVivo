import { Link } from "react-router-dom";
import { useAuth } from '../services/AuthContext';
import '../css/NavBar.css'

function NavBar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">SegnoVivo</Link>
      </div>
      
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        
        {user ? (
          <>
            <Link to="/translate">Translate</Link>
            {/* <Link to="/download">Download</Link> */}
            <span className="user-info">Welcome, {user.user?.username || 'User'}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar