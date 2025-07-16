import '../css/About.css';
import { useState } from 'react';
import kt from '../images/kt.png';
import jg from '../images/jg.png';
import caption from '../images/caption.png';
import settings from '../images/Settings.png';
import widget from '../images/Widgets.png';
import secure from '../images/Secure.png';

const features = [
  {
    img: caption,
    text: 'Real-time sign language translation',
  },
  {
    img: settings,
    text: 'User-friendly and accessible interface',
  },
  {
    img: secure,
    text: 'Secure authentication and privacy',
  },
  {
    img: widget,
    text: 'Designed to empower deaf individuals',
  },
];

function About() {
  const [featureIndex, setFeatureIndex] = useState(0);

  const prevFeature = () => {
    setFeatureIndex((prev) => (prev === 0 ? features.length - 1 : prev - 1));
  };
  const nextFeature = () => {
    setFeatureIndex((prev) => (prev === features.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="about-section">
      <div className="about-card">
        <h1 className="about-title">About <span className="brand-highlight">SegnoVivo</span></h1>
        <p className="about-intro">
          SegnoVivo was founded out of a passion to bridge the communication gap between deaf and hearing communities. Our mission is to empower deaf individuals by providing accessible, real-time sign language translation and fostering inclusivity in every interaction. We believe technology can break barriers and create a more connected world for everyone.
        </p>
        <section className="features-section" aria-labelledby="features-heading">
          <h2 id="features-heading" className="section-heading-centered"><i className="fas fa-star about-icon"></i>Platform Features</h2>
          <div className="features-carousel">
            <button className="carousel-btn left" onClick={prevFeature} aria-label="Previous Feature">&#8592;</button>
            <div className="feature-card">
              {features[featureIndex].img ? (
                <img className="feature-card-img" src={features[featureIndex].img} alt="Feature" />
              ) : (
                <i className={`${features[featureIndex].icon} feature-card-icon`}></i>
              )}
              <span className="feature-card-text">{features[featureIndex].text}</span>
            </div>
            <button className="carousel-btn right" onClick={nextFeature} aria-label="Next Feature">&#8594;</button>
          </div>
        </section>
        <section className="founders-section" aria-labelledby="founders-heading">
          <h2 id="founders-heading" className="founders-heading-centered"><i className="fas fa-users about-icon"></i>Founders</h2>
          <div className="founders-list">
            <div className="founder-card">
              <img className="founder-img" src={kt} alt="Founder One" />
              <h3 className="founder-name">Kai Teng</h3>
              <p className="founder-desc">A passionate technologist dedicated to accessibility and inclusion.</p>
            </div>
            <div className="founder-card">
              <img className="founder-img" src={jg} alt="Founder Two" />
              <h3 className="founder-name">Jordan</h3>
              <p className="founder-desc">An advocate for the deaf community and innovative solutions.</p>
            </div>
          </div>
        </section>
        <section className="mission-section" aria-labelledby="mission-heading">
          <h2 id="mission-heading" className="section-heading-centered"><i className="fas fa-bullseye about-icon"></i> Our Mission</h2>
          <p>
            We believe that communication should be accessible to everyone. Our platform uses advanced technology to make sign language translation more accessible and accurate.
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
