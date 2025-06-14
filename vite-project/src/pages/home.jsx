import coverImage from '../images/Cover_Image.png'
import "../css/Home.css"

function Home() {
    return (
        <>
        <div class="main-container">
            <div class="blur-circle1">
    
            </div>
            <div class="blur-circle2">
    
            </div>
          <div class="landing-page">
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

export default Home