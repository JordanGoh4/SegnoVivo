import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Contact from './pages/contact'
import NavBar from './components/NavBar'
import Login from './pages/login'


function App() {

  return (
    <>
    <main className='main-content'>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/contact' element={<Contact />}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </main>
    </>
  )
}

export default App
