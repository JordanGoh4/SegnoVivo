import "../css/Login.css";
import { Link } from "react-router-dom";
import Google from "../images/Google.png";
import Envelope from "../images/Envelope.png";
import X from "../images/X.png";
import { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Save user and token (if using JWT)
      login({ 
        user: data.user,
        token: data.token 
      });
      
      // Redirect to protected page
      navigate('/');
      
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h1>Login to Your Account</h1>
          {error && <div className="error">{error}</div>}

          <div className="social-login">Login using social account</div>

          <div className="social-icon">
            <img src={Google}></img>
            <img src={Envelope}></img>
            <img src={X}></img>
          </div>

          <div className="divider">
            <span>OR</span>
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
              />
            </div>

            <button type="submit" className="signin-btn">
              Sign In
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
