import extensionPreview from '../images/Depression.png';

function Download() {
  return (
    <div className="download-container" style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Sign Language Caption Extension</h1>
      <p>
        Our browser extension brings real-time sign language captioning to your web experience. It translates spoken or written content into sign language using an animated avatar, making digital content more accessible for the Deaf and Hard of Hearing community.
      </p>
      <h2>How It Works</h2>
      <ul>
        <li>Captions audio or text content on supported web pages.</li>
        <li>Displays an animated avatar performing the corresponding sign language.</li>
        <li>Easy to toggle on/off and customize from the extension popup.</li>
      </ul>
      <h2>Extension Preview</h2>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <img src={extensionPreview} alt="Extension Preview" style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        <p style={{ color: '#888', marginTop: 8 }}><em>Example of the extension's avatar captioning a video.</em></p>
      </div>
      <h2>How to Use</h2>
      <ol>
        <li>Download and install the extension from the Chrome Web Store (or your browser's store).</li>
        <li>Pin the extension for quick access.</li>
        <li>Click the extension icon to open the popup and enable/disable captioning.</li>
        <li>Enjoy accessible content with real-time sign language translation!</li>
      </ol>
      <p style={{ marginTop: 32, color: '#555' }}>
        <strong>Note:</strong> The extension works best on supported video and audio content. For feedback or support, contact us via the information on our website.
      </p>
    </div>
  );
}

export default Download;