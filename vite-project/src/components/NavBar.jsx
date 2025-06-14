import { Link } from "react-router-dom";
import '../css/NavBar.css'

function NavBar () {
    return (
        <>
            <div class="container">
            <a href="#" class="logo">SegnoVivo</a>
            <ul class="links">
                <li>Home</li>
                <li><a href='/'>About Us</a></li>
                <li>Translate</li>
                <li>
                <Link to = "/contact">Info</Link>
                </li>
                <li>Download</li>
            </ul>
            </div>
        </>
    )
}

export default NavBar