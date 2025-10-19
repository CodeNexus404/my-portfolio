import React from 'react';

const Projects = () => {
  return (
    <main>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">Portfolio of my recent work and achievements</p>
        </div>
      </section>

      <section className="projects-section">
        <div className="container">
          <div className="project-list">
            <a href="https://github.com/username/online-store" target="_blank" rel="noopener noreferrer" className="project-item">
              <div className="project-image">
                <div className="project-placeholder">
                  <i className="fas fa-shopping-cart"></i>
                </div>
              </div>
              <div className="project-content">
                <h3>Online Store</h3>
                <p>Simple e-commerce website for selling products online.</p>
                <p><strong>Technologies:</strong> HTML, CSS, JavaScript</p>
              </div>
            </a>

            <a href="https://github.com/username/calculator-app" target="_blank" rel="noopener noreferrer" className="project-item">
              <div className="project-image">
                <div className="project-placeholder">
                  <i className="fas fa-calculator"></i>
                </div>
              </div>
              <div className="project-content">
                <h3>Calculator App</h3>
                <p>Basic calculator application for performing mathematical operations.</p>
                <p><strong>Technologies:</strong> JavaScript, HTML, CSS</p>
              </div>
            </a>

            <a href="https://github.com/username/todo-list" target="_blank" rel="noopener noreferrer" className="project-item">
              <div className="project-image">
                <div className="project-placeholder">
                  <i className="fas fa-sticky-note"></i>
                </div>
              </div>
              <div className="project-content">
                <h3>To-Do List</h3>
                <p>Simple task management application to organize daily activities.</p>
                <p><strong>Technologies:</strong> HTML, CSS, JavaScript</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Projects;
