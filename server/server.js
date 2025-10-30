// --- Imports ---
import express from "express";
import cors from "cors";
import pg from "pg"; // Import the node-postgres package

// --- App Initialization ---
const app = express();
const { Pool } = pg;

// --- CORS (Cross-Origin Resource Sharing) Configuration ---
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://my-portfolio-live-a274.onrender.com"
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};
app.use(cors(corsOptions));

// --- JSON Middleware ---
app.use(express.json());

// --- Database Connection (DATABASE FIX) ---
// The Pool will automatically use the DATABASE_URL environment variable
// that Render provides (from Step 2).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render connections
  }
});

// --- Create Database Table (Runs once on start) ---
const createTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      subject VARCHAR(255),
      newsletter BOOLEAN,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(queryText);
    console.log("Table 'messages' is ready.");
  } catch (err) {
    console.error("Error creating database table:", err);
  }
};

// Call the function to ensure the table exists when the server starts
createTable();

// --- API POST Route ---
app.post("/api/contact", async (req, res) => {
  console.log("Received contact form submission:", req.body);
  
  // Get data from the request body
  const { name, email, message, subject, newsletter } = req.body;

  // --- Server-side Validation ---
  if (!name || !email || !message) {
    console.error("Missing required fields");
    return res.status(400).json({ 
      success: false, 
      message: "Please fill in all required fields" 
    });
  }

  // --- Try/Catch Block ---
  try {
    // --- Insert Data into Database ---
    const queryText = `
      INSERT INTO messages (name, email, message, subject, newsletter)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [name, email, message, subject || null, newsletter || false];
    
    // Execute the query
    const dbResponse = await pool.query(queryText, values);
    
    console.log("Message saved successfully:", dbResponse.rows[0]);
    
    // --- Send Success Response ---
    res.json({ 
      success: true, 
      message: "Message sent successfully" 
    });

  } catch (error) {
    // --- Global Error Handling ---
    console.error("Database error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save message. Please try again." 
    });
  }
});

// --- Server Listen ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
