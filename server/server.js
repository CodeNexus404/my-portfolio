import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
// Configure CORS to accept requests from your React app
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

const DATA_FILE = "messages.json";

// Initialize the data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]");
}

app.post("/api/contact", (req, res) => {
  console.log("Received contact form submission:", req.body);
  
  // Validate incoming data
  if (!req.body.name || !req.body.email || !req.body.message) {
    console.error("Missing required fields");
    return res.status(400).json({ 
      success: false, 
      message: "Please fill in all required fields" 
    });
  }

  try {
    // Ensure the messages.json file exists
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }

    // Read existing data
    let data = [];
    try {
      const fileContent = fs.readFileSync(DATA_FILE, "utf8");
      data = JSON.parse(fileContent);
    } catch (readError) {
      console.error("Error reading data file:", readError);
      data = [];
    }

    // Add new message
    data.push({
      ...req.body,
      timestamp: new Date().toISOString()
    });

    // Save updated data
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    
    console.log("Message saved successfully");
    res.json({ 
      success: true, 
      message: "Message sent successfully" 
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save message. Please try again." 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));