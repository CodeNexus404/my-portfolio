import React from 'react';

const Skills = () => {
  return (
    <main>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">My Skills</h1>
          <p className="page-subtitle">Technical expertise and tools I work with</p>
        </div>
      </section>

      <section className="skills-overview">
        <div className="container">
          <div className="skills-grid">
            <div className="skill-category">
              <h3>Frontend</h3>
              <div className="skills-list">
                <div className="skill-item">
                  <i className="fab fa-html5"></i>
                  <span className="skill-name">HTML</span>
                </div>
                <div className="skill-item">
                  <i className="fab fa-css3-alt"></i>
                  <span className="skill-name">CSS</span>
                </div>
                <div className="skill-item">
                  <i className="fab fa-js-square"></i>
                  <span className="skill-name">JavaScript</span>
                </div>
                <div className="skill-item">
                  <i className="fab fa-react"></i>
                  <span className="skill-name">React</span>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>Backend</h3>
              <div className="skills-list">
                <div className="skill-item">
                  <i className="fab fa-node-js"></i>
                  <span className="skill-name">Node.js</span>
                </div>
                <div className="skill-item">
                  <i className="fab fa-python"></i>
                  <span className="skill-name">Python</span>
                </div>
                <div className="skill-item">
                  <i className="fas fa-database"></i>
                  <span className="skill-name">MySQL</span>
                </div>
              </div>
            </div>

            <div className="skill-category">
              <h3>Tools</h3>
              <div className="skills-list">
                <div className="skill-item">
                  <i className="fab fa-git-alt"></i>
                  <span className="skill-name">Git</span>
                </div>
                <div className="skill-item">
                  <i className="fas fa-code"></i>
                  <span className="skill-name">VS Code</span>
                </div>
                <div className="skill-item">
                  <i className="fab fa-figma"></i>
                  <span className="skill-name">Figma</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Skills;
