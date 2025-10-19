Personal Portfolio Website

This is a full-stack personal portfolio website built with React for the frontend and a Node.js/Express backend to handle contact form submissions. The project is deployed and live on Render.

[Live Demo](https://my-portfolio-live-a274.onrender.com/)


# Tech Stack

Frontend: React.js, React Router

Backend: Node.js, Express.js

Styling: CSS

Deployment: Render


# Features

Multi-Page Navigation: Smooth client-side routing between Home, Skills, Projects, Hobbies, and Contact pages using React Router.

Responsive Design: A clean and modern UI that adapts to different screen sizes.

Functional Contact Form: A contact form that captures user input (name, email, message, etc.).

Backend Data Persistence: The Express server receives form submissions, adds a timestamp, and saves them to a messages.json file on the server.

# Project Structure

The repository is structured as a monorepo with two distinct projects:

    my-portfolio/
    │
    ├── client/      # React Frontend App
    │   ├── public/
    │   ├── src/
    │   └── package.json
    │
    └── server/      # Node.js/Express Backend Server
        ├── messages.json
        ├── server.js
        └── package.json


Setup and Run Locally

To run this project on your local machine, you will need two separate terminals.

Prerequisites

Node.js (which includes npm) installed on your machine.

1. Clone the Repository

git clone [https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git](https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git)
cd my-portfolio


2. Run the Backend Server

Open your first terminal and navigate to the server directory.

# Go to the server folder
    cd server

# Install dependencies
    npm install

# Start the server
    npm start


The backend will now be running on http://localhost:5000.

3. Run the Frontend Client

Open a second, new terminal and navigate to the client directory.

# Go to the client folder from the root
    cd client

# Install dependencies
    npm install

# Start the React app
    npm start


The frontend will open automatically in your browser at http://localhost:3000.

Note: For local testing, ensure the backendUrl variable in client/src/pages/Contact.jsx is set to http://localhost:5000/api/contact.

# Deployment

This project is deployed on Render:

The client directory is deployed as a Static Site.

The server directory is deployed as a Web Service.

The free tier for the Web Service will spin down after 15 minutes of inactivity, so the first contact form submission may take up to a minute to process.
