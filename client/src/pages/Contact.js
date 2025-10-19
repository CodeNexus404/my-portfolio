import React, { useState } from 'react';

// Make sure to import your contact page styles if they are in a separate file
// import './Contact.css'; 

const Contact = () => {
  // Use state to manage all form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    newsletter: false,
  });
  const [status, setStatus] = useState("Send Message");

  // Update state on any input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill in all required fields.');
      setStatus("Send Message");
      return;
    }
    
    // This is our original backend URL
    // Make sure this is "http://localhost:5000/api/contact" for testing
    // or your live Render URL for deployment.
    const backendUrl = "http://localhost:5000/api/contact";
    
    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
        // Remove credentials since we're not using sessions
        credentials: 'omit'
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Message sent successfully!");
        // Reset the form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          newsletter: false,
        });
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      alert(error.message || "An error occurred. Please try again.");
    }
    
    setStatus("Send Message");
  };

  // This is your new, beautiful HTML form
  return (
    <main>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">Get In Touch</h1>
          <p className="page-subtitle">Let's work together and bring your ideas to life</p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              {/* All your contact-info HTML is great, no changes needed here */}
              <h2>Let's Start a Conversation</h2>
              <p>
                I'm always excited to hear about new projects and opportunities. Whether you have a 
                specific project in mind, want to collaborate, or just want to say hello, I'd love 
                to hear from you!
              </p>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon"><i className="fas fa-envelope"></i></div>
                  <div className="method-content">
                    <h3>Email</h3>
                    <p>shedgesahil2005@gmail.com</p>
                    <a href="mailto:shedgesahil2005@gmail.com">Send Email</a>
                  </div>
                </div>
                {/* ... other contact methods ... */}
                 <div className="contact-method">
                  <div className="method-icon"><i className="fas fa-phone"></i></div>
                  <div className="method-content">
                    <h3>Phone</h3>
                    <p>+91 9112203646</p>
                    <a href="tel:+919112203646">Call Now</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon"><i className="fas fa-map-marker-alt"></i></div>
                  <div className="method-content">
                    <h3>Location</h3>
                    <p>Pune, India</p>
                    <a href="https://maps.app.goo.gl/M3Zbabgi2oKRE3oj7" target="_blank" rel="noopener noreferrer">View on Map</a>
                  </div>
                </div>
              </div>

              <div className="social-contact">
                {/* ... social links ... */}
              </div>
            </div>

            <div className="contact-form-container">
              {/* Use our new handleSubmit function */}
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <h3>Send me a message</h3>
                
                {/* Connect inputs to state with `value` and `onChange` */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input 
                    type="text" id="name" name="name" required 
                    value={formData.name} onChange={handleChange} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input 
                    type="email" id="email" name="email" required 
                    value={formData.email} onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input 
                    type="text" id="subject" name="subject" required 
                    value={formData.subject} onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea 
                    id="message" name="message" rows="5" required
                    value={formData.message} onChange={handleChange}
                  ></textarea>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" id="newsletter" name="newsletter" 
                      checked={formData.newsletter} onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Subscribe to my newsletter for updates and tips
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={status === "Sending..."}>
                  <i className="fas fa-paper-plane"></i>
                  {status}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;