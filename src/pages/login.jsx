import "../css/Login.css";
import { Link } from "react-router-dom";
import Google from "../images/Google.png";
import Envelope from "../images/Envelope.png";
import X from "../images/X.png";
import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h1>Login to Your Account</h1>

          <div className="social-login">Login using social account</div>

          <div className="social-icon">
            <img src={Google}></img>
            <img src={Envelope}></img>
            <img src={X}></img>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <form className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
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
