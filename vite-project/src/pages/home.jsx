import coverImage from '../images/Cover_Image.png'
import SegnoVivo from '../images/Logo.png'
import "../css/Home.css"
import { Link } from 'react-router-dom';
import Navbar from "../components/NavBar"

const Home = () => {
  return (
   <>
   <div className="segno-vivo-container">
      <nav className="navbar">
        <div className="logo">
          <img src = {SegnoVivo} className='SegnoVivo'></img>
          SegnoVivo
        </div>
        <div className="nav-links">
          <a href="#home" className="active">Home</a>
          <a href="#translate">Translate</a>
          <a href="#about">About</a>
          <Link to="login" className='nav-links'>Login</Link>
        </div>
      </nav>

      <main className="hero-section">
        <img className = 'cover_image' src={coverImage}/>
        <h1>Making Communication Easier With Technology</h1>
        <p className="subtext">
          Utilizing machine learning and artificial intelligence to allow easier
          understanding of online resources be it videos or audio. With an
          extension that can be accessed with any browser, users will be able to
          view real-life translation with ease.
        </p>
      </main>
    </div>
   </> 
  )
};

export default Home;