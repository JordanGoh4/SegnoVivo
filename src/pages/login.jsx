import "../css/Login.css";
import { Link } from "react-router-dom";
import Google from "../images/Google.png";
import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        login({ 
          user: user,
          token: token 
        });
        navigate('/');
      } catch (err) {
        setError('Google login failed. Please try again.');
        console.error('Google login error:', err);
      }
    }
  }, [location, login, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Starting login with:', credentials);
    
    try {
      const result = await login(credentials);
      console.log('Login successful:', result);
      
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      console.log('Login process finished');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h1>Login to Your Account</h1>
          {error && <div className="error">{error}</div>}

          <div className="social-login">Login using social account</div>

          <div className="social-icon" style={{ marginBottom: '1.5rem' }}>
            <a href="https://segnovivo-c1iv.onrender.com/auth/google">

              <img src={Google} alt="Google Login"></img>
            </a>
          </div>

          <div className="divider centered-divider">
            <span></span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="signup-section">
            <h2>New Here?</h2>
            <p>Create an Account Now!</p>
            <Link to="/signup">
              <button className="signup-btn">Sign Up</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;