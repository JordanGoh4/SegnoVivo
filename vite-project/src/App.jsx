import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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
            <a href="#" class="logo">Your <b>Website</b></a>
            <ul class="links">
              <li>Home</li>
              <li>About Us</li>
              <li>Work</li>
              <li>Info</li>
              <li>Get Started</li>
            </ul>
          </div>
        </header>
        <div class="content">
          <div class="container">
            <div class="info">
              <h1>Looking For Inspiration</h1>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus odit nihil ullam nesciunt quidem iste, Repellendus odit nihil</p>
              <button>Button name</button>
            </div>
            <div class="image">
              <img class="main-image" src="https://cdni.iconscout.com/illustration/premium/thumb/businessman-working-using-vr-tech-3840669-3202986.png?f=webp"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App
