import { useState, useEffect } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/AuthContext";
import Google from "../images/Google.png";
import "../css/SignUp.css";

function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
}

function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

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
        setError('Google signup failed. Please try again.');
        console.error('Google signup error:', err);
      }
    }
  }, [location, login, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (!formData.username || !formData.email || !formData.password) {
        setError("Please fill all fields");
        return;
      }
      if (!validatePassword(formData.password)) {
        setError(
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        );
        return;
      }
      const response = await registerUser(formData);

      if (response.error || (response.data && response.data.error)) {
        if (
          (response.error && response.error.toLowerCase().includes("exists")) ||
          (response.data && response.data.error && response.data.error.toLowerCase().includes("exists"))
        ) {
          window.alert("A user with this username or email already exists.");
        }
        setError(response.error || response.data.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("exists")) {
        window.alert("A user with this username or email already exists.");
      }
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <>
      <div className="form-container">
        <div className="form-wrapper">
          <h2 className="form-title">Create Account</h2>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              Registration successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <small>Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</small>
            </div>

            <button type="submit" className="submit-btn">
              Create
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUp;
