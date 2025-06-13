import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Contact from './pages/contact'

import './App.css'


function App() {

  return (
    <>
    <main className='main-content'>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/contact' element={<Contact />}/>
      </Routes>
    </main>
    </>
  )
}

export default App
