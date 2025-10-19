import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Hi, I'm <span className="highlight">Sahil Shedge</span></h1>
              <p className="hero-subtitle">Web Developer</p>
              <p className="hero-description">
                I am Software Engineer and I create beautiful, functional websites and applications.
              </p>
              <div className="social-links">
                <a href="https://github.com/CodeNexus404" className="social-link">
                  <i className="fab fa-github"></i>
                </a>
                <a href="https://www.linkedin.com/in/sahil-shedge-a99401292/" className="social-link">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
              <div className="hero-buttons">
                <Link to="/projects" className="btn btn-primary">View My Work</Link>
                <Link to="/contact" className="btn btn-secondary">Contact Me</Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="profile-image">
                <img src="/profile.jpg" alt="Sahil Shedge Profile Picture" draggable="false" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about">
        <div className="container">
          <h2 className="section-title">About Me 🧑🏻‍💻</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                I'm a passionate Software Engineer, web developer studing B.Tech Engineering in PCU. 
                With experience in modern web technologies, I enjoy creating responsive websites 
                that provide excellent user experiences.
              </p>
              <p>
                When I'm not coding, you can find me exploring new technologies, contributing to 
                open-source projects, or pursuing my hobbies that keep me creative and inspired.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <i className="fab fa-html5"></i>
                <h3>HTML</h3>
              </div>
              <div className="stat">
                <i className="fab fa-css3-alt"></i>
                <h3>CSS</h3>
              </div>
              <div className="stat">
                <i className="fab fa-js-square"></i>
                <h3>JavaScript</h3>
              </div>
              <div className="stat">
                <i className="fas fa-database"></i>
                <h3>MySQL</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-links">
        <div className="container">
          <h2 className="section-title">Quick Links 🔗</h2>
          <div className="links-grid">
            <Link to="/skills" className="link-card">
              <i className="fas fa-code"></i>
              <h3>Skills</h3>
            </Link>
            <Link to="/projects" className="link-card">
              <i className="fas fa-laptop-code"></i>
              <h3>Projects</h3>
            </Link>
            <Link to="/hobbies" className="link-card">
              <i className="fas fa-gamepad"></i>
              <h3>Hobbies</h3>
            </Link>
            <Link to="/contact" className="link-card">
              <i className="fas fa-envelope"></i>
              <h3>Contact</h3>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
