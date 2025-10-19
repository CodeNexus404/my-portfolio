# Portfolio Website - React Version

This is a React.js version of Sahil Shedge's portfolio website, converted from the original HTML/CSS structure.

## Features

- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **React Router**: Single Page Application with client-side routing
- **Component-based Architecture**: Modular and reusable components
- **Modern UI**: Clean and professional design with Font Awesome icons

## Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation component
│   └── Footer.js          # Footer component
├── pages/
│   ├── Home.js            # Home page component
│   ├── Skills.js          # Skills page component
│   ├── Projects.js        # Projects page component
│   ├── Hobbies.js         # Hobbies page component
│   └── Contact.js         # Contact page component
├── styles/
│   └── styles.css         # Main stylesheet
├── App.js                 # Main App component with routing
└── index.js               # React entry point

public/
├── index.html             # HTML template
└── profile.jpg            # Profile image
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Pages

- **Home**: Introduction, about section, and quick links
- **Skills**: Technical skills organized by category
- **Projects**: Portfolio of recent work
- **Hobbies**: Personal interests and activities
- **Contact**: Contact information and message form

## Technologies Used

- React 18
- React Router DOM
- CSS3 (Grid, Flexbox)
- Font Awesome Icons
- HTML5

## Original Files

The original HTML files are preserved in the root directory:
- `index.html` - Original home page
- `skills.html` - Original skills page
- `projects.html` - Original projects page
- `hobby.html` - Original hobbies page
- `contact.html` - Original contact page
- `styles.css` - Original stylesheet
- `profile.jpg` - Profile image

## Customization

To customize this portfolio:

1. Update personal information in the respective page components
2. Modify the CSS in `src/styles/styles.css`
3. Add or remove projects in `src/pages/Projects.js`
4. Update skills in `src/pages/Skills.js`
5. Change contact information in `src/pages/Contact.js`

## Deployment

To deploy this React app:

1. Build the production version:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service (Netlify, Vercel, GitHub Pages, etc.)

## License

This project is for personal portfolio use. All rights reserved.
