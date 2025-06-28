import {Routes, Route} from 'react-router-dom'
import Home from './pages/home'
import Contact from './pages/contact'
import About from './pages/about'
import NavBar from './components/NavBar'
import Login from './pages/login'
import SignUp from './pages/signup'
import Translate from './pages/translate'
import Download from './pages/download'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './services/AuthContext'

function App() {
  return (
    <AuthProvider>
      <NavBar />
      <main className='main-content'>
        <Routes>
          <Route path='/' element={<Home />}/>
          <Route path='/contact' element={<Contact />}/>
          <Route path='/about' element={<About />}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/signup' element={<SignUp/>}/>
          <Route path='/translate' element={
            <ProtectedRoute>
              <Translate />
            </ProtectedRoute>
          }/>
          <Route path='/download' element={
            <ProtectedRoute>
              <Download />
            </ProtectedRoute>
          }/>
        </Routes>
      </main>
    </AuthProvider>
  )
}

export default App
