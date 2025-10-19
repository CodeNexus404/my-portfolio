import React from 'react';

const Hobbies = () => {
  return (
    <main>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">My Hobbies</h1>
          <p className="page-subtitle">What I love to do in my free time</p>
        </div>
      </section>

      <section className="hobbies-grid">
        <div className="container">
          <div className="hobby-card">
            <div className="hobby-icon">
              <i className="fas fa-camera"></i>
            </div>
            <h3>Photography</h3>
            <p>I love capturing moments and exploring different perspectives through photography.</p>
          </div>

          <div className="hobby-card">
            <div className="hobby-icon">
              <i className="fas fa-gamepad"></i>
            </div>
            <h3>Gaming</h3>
            <p>Since childhood i have been facinated towards console games. Later I got intrest in PC and Mobile Games.
            GTA 5 and RDR2 are one of my favourite games.
            </p>
          </div>

          <div className="hobby-card">
            <div className="hobby-icon">
              <i className="fas fa-book"></i>
            </div>
            <h3>Reading</h3>
            <p>I'm an avid reader who enjoys both fiction and non-fiction books.</p>
          </div>

          <div className="hobby-card">
            <div className="hobby-icon">
              <i className="fas fa-hiking"></i>
            </div>
            <h3>Hiking</h3>
            <p>Spending time in nature is essential for my well-being.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Hobbies;
