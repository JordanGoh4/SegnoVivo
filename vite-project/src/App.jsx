import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Navbar from './components/NavBar';
import Hero from './components/Hero';
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="bg-indigo-700 text-white min-h-screen font-[Lexend]">
      <Navbar />
      <Hero />
    </div>
    </>
  )
}

export default App
