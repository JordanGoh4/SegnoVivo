import '../css/Contact.css';

function Contact() {
  return (
    <div className="contact-section">
      <div className="contact-us">
        <div className="contact-inner">
          <div className="contact-content">
            <section className="form-section" aria-labelledby="contact-heading">
              <div className="contact-form-inner">
                <div className="contact-field">
                  <h2 id="contact-heading">Contact Us</h2>
                  <p>Feel free to contact us any time. We will get back to you as soon as we can!</p>
                  <form className="contact-form" autoComplete="off">
                    <input type="text" className="form-control" placeholder="Name" aria-label="Name" />
                    <input type="email" className="form-control" placeholder="Email" aria-label="Email" />
                    <textarea className="form-control" placeholder="Message" aria-label="Message"></textarea>
                    <button className="contact-form-submit" type="submit">Send</button>
                  </form>
                </div>
                {/* <div className="social-section">
                  <ul className="social-item-inner">
                    <li><a href="#" aria-label="Facebook" className="facebook"><i className="fab fa-facebook-square"></i></a></li>
                    <li><a href="#" aria-label="Instagram" className="instagram"><i className="fab fa-instagram"></i></a></li>
                    <li><a href="#" aria-label="Twitter" className="twitter"><i className="fab fa-twitter"></i></a></li>
                  </ul>
                </div> */}
              </div>
            </section>
            <aside className="contact-info-sec" aria-labelledby="info-heading">
              <h3 id="info-heading">Contact Info</h3>
              <div className="info-single"><span className="icon-circle"><i className="fas fa-headset"></i></span><span>+91 8009 054294</span></div>
              <div className="info-single"><span className="icon-circle"><i className="fas fa-envelope-open-text"></i></span><span>info@flightmantra.com</span></div>
              <div className="info-single"><span className="icon-circle"><i className="fas fa-map-marked-alt"></i></span><span>1000+ Travel partners and 65+ Service city across India, USA, Canada & UAE</span></div>
            </aside>
          </div>
        </div>
      </div>
      <section className="map-sec" aria-labelledby="map-heading">
        <div className="map-inner">
          <h3 id="map-heading">Find Us on Google Map</h3>
          <div className="map-bind">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18..."
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              aria-hidden="false"
              tabIndex="0"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;