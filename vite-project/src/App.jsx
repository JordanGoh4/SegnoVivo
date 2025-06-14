import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Contact from './pages/contact'
import NavBar from './components/NavBar'


function App() {

  return (
    <>
    <header>
      <NavBar />
    </header>
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
