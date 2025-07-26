import { Link } from "react-router-dom";
import { useAuth } from '../services/AuthContext';
import '../css/NavBar.css'
import HomeIcon from '../images/Home.png';
import AboutIcon from '../images/About.png';
import ContactIcon from '../images/Contact.png';
import LoginIcon from '../images/Login.png';
import UserIcon from '../images/User.png';
import CaptionIcon from '../images/Caption.png';

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
        <Link to="/">
          <img src={HomeIcon} alt="Home" className="nav-icon" />
        </Link>
        <Link to="/about">
          <img src={AboutIcon} alt="About" className="nav-icon" />
        </Link>
        <Link to="/contact">
          <img src={ContactIcon} alt="Contact" className="nav-icon" />
        </Link>
        {user ? (
          <>
            <Link to="/translate">
              <img src={CaptionIcon} alt="Translate" className="nav-icon" />
            </Link>
            <Link to="/download">Download</Link>
            <span className="user-info">Welcome, {user.user?.username || 'User'}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">
              <img src={LoginIcon} alt="Login" className="nav-icon" />
            </Link>
            <Link to="/signup">
              <img src={UserIcon} alt="Sign Up" className="nav-icon" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar