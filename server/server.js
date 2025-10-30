// --- Imports ---
// Import all the necessary modules from Node.js
import express from "express"; // The web server framework (Express.js)
import fs from "fs";         // The Node.js File System module (to read and write files)
import cors from "cors";       // Middleware to handle Cross-Origin Resource Sharing (CORS)
import path from "path";       // **CRITICAL FOR RENDER**: Module to handle file paths correctly

// --- App Initialization ---
// Create a new instance of an Express application
const app = express();

// --- CORS (Cross-Origin Resource Sharing) Configuration ---
// Apply the CORS middleware to allow your frontend to make requests
app.use(cors({
  // Define the specific websites (origins) that are allowed to make requests
  origin: [
    'http://localhost:3000', // For local development
    'http://localhost:5000', // For local development
    'https://my-portfolio-live-a274.onrender.com' // For your live website
  ],
  methods: ['GET', 'POST'], // Specify which HTTP methods are allowed
  credentials: true // Allow cookies or authorization headers if needed
}));

// --- JSON Middleware ---
// Apply the built-in Express middleware to parse incoming request bodies as JSON.
// This is what allows you to read the data from your form using `req.body`.
app.use(express.json());

// --- Persistent File System Setup (CRITICAL FOR RENDER) ---
// Render's normal file system is "ephemeral" (it gets erased).
// We must use the "Persistent Disk" path that you set up in Render's dashboard.
const DATA_DIR = "/var/data"; // This is the Mount Path for your persistent disk
const DATA_FILE = path.join(DATA_DIR, "messages.json"); // Use `path.join` to safely create the full file path

// Ensure the data directory exists on the persistent disk
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize the data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

// --- API POST Route ---
// Define the main API endpoint for handling contact form submissions.
// `app.post` means this route only responds to HTTP POST requests.
app.post("/api/contact", (req, res) => {
  console.log("Received contact form submission:", req.body);
  
  // --- Server-side Validation ---
  // Check if any of the required fields are missing from the request
  if (!req.body.name || !req.body.email || !req.body.message) {
    console.error("Missing required fields");
    // If data is missing, send a 400 "Bad Request" error back to the frontend
    return res.status(400).json({ 
      success: false, 
      message: "Please fill in all required fields" 
    });
  }

  // --- Try/Catch Block ---
  // Use a try/catch block to handle any errors during file reading or writing.
  try {
    // --- Read Existing Data ---
    let data = [];
    try {
      // Read the raw text content from our persistent `messages.json` file
      const fileContent = fs.readFileSync(DATA_FILE, "utf8");
      
      // If the file is not empty, parse the JSON string into a JavaScript array
      if (fileContent) {
        data = JSON.parse(fileContent);
      }
    } catch (readError) {
      // If the file is corrupted or unreadable, log the error
      console.error("Error reading or parsing data file:", readError);
      // Start with a fresh array to prevent crashing and allow the new message to be saved
      data = []; 
    }

    // --- Add New Message ---
    // Push the new message object (from `req.body`) into the array
    data.push({
      ...req.body,
      timestamp: new Date().toISOString() // Add a timestamp for when it was received
    });

    // --- Save Updated Data ---
    // Write the modified array back to the `messages.json` file.
    // `JSON.stringify(data, null, 2)` formats the JSON to be human-readable.
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    
    console.log("Message saved successfully");
    
    // --- Send Success Response ---
    // Send a 200 "OK" success response back to the frontend
    res.json({ 
      success: true, 
      message: "Message sent successfully" 
    });

  } catch (error) {
    // --- Global Error Handling ---
    // If any error happened in the main `try` block, send a 500 "Internal Server Error"
    console.error("Server error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save message. Please try again." 
    });
  }
});

// --- Server Listen ---
// Define the port the server will run on.
// `process.env.PORT` is the port Render provides automatically.
// `5000` is the fallback for local development.
const PORT = process.env.PORT || 5000;

// Start the server and make it listen for connections on the specified port.
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));