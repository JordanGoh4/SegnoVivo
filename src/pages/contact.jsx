import '../css/Contact.css'

function contact() {
  return (
    <div className="contact-section">
      <div className="contact-us">
        <div className="contact-inner">
          <div className="contact-content">
            <div className="form-section">
              <div className="contact-form-inner">
                <div className="contact-field">
                  <h3>Contact Us</h3>
                  <p>
                    Feel Free to contact us any time. We will get back to you as soon as we can!
                  </p>
                  <input type="text" className="form-control" placeholder="Name" />
                  <input type="text" className="form-control" placeholder="Email" />
                  <textarea className="form-control" placeholder="Message"></textarea>
                  <button className="contact-form-submit">Send</button>
                </div>
              </div>
            </div>
            <div className="social-section">
              <ul className="social-item-inner">
                <li><a href="#"><i className="fab fa-facebook-square"></i></a></li>
                <li><a href="#"><i className="fab fa-instagram"></i></a></li>
                <li><a href="#"><i className="fab fa-twitter"></i></a></li>
              </ul>
            </div>
          </div>

          <div className="contact-info-sec">
            <h4>Contact Info</h4>
            <div className="info-single">
              <i className="fas fa-headset"></i>
              <span>+91 8009 054294</span>
            </div>
            <div className="info-single">
              <i className="fas fa-envelope-open-text"></i>
              <span>info@flightmantra.com</span>
            </div>
            <div className="info-single">
              <i className="fas fa-map-marked-alt"></i>
              <span>1000+ Travel partners and 65+ Service city across India, USA, Canada & UAE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="map-sec">
        <div className="map-inner">
          <h4>Find Us on Google Map</h4>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit...</p>
          <div className="map-bind">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18..."
              width="100%"
              height="450"
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen=""
              aria-hidden="false"
              tabIndex="0"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}


export default contact