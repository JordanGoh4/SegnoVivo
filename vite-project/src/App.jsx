import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import coverImage from './images/Cover_Image.png'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div class="main-container">
        <div class="blur-circle1">

        </div>
        <div class="blur-circle2">

        </div>
      <div class="landing-page">
        <header>
          <div class="container">
            <a href="#" class="logo">SegnoVivo</a>
            <ul class="links">
              <li>Home</li>
              <li>About Us</li>
              <li>Translate</li>
              <li>Info</li>
              <li>Download</li>
            </ul>
          </div>
        </header>
        <div class="content">
          <div class="container">
            <div class="info">
              <h1>Making Communication Easier With Technology</h1>
              <p>Utilizing machine learning and artificial intelligence to allow easier understanding of online resources be it videos or audio. With a extension that can be access with any browser, users will be able to view real-life translation with ease</p>
              <button>Find out more!</button>
            </div>
            <div class="image">
              <img class="main-image" src={coverImage}/>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App
