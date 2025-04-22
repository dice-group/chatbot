// server.js
// Import required Node.js modules and packages
const express = require('express');  // Web framework for Node.js
const cors = require('cors');        // Middleware for enabling CORS
const OpenAI = require('openai');    // OpenAI API client library
const path = require('path');        // Utility for working with file paths
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });  // Load environment variables from .env.local

// Initialize Express application
const app = express();

// Configure middleware
app.use(cors());                     // Enable CORS for all routes
app.use(express.json());             // Parse JSON request bodies

// Log environment configuration (without exposing sensitive data)
console.log('Environment check:');
console.log('URL:', process.env.URL);
console.log('MODEL_NAME:', process.env.MODEL_NAME);
console.log('API_KEY exists:', !!process.env.API_KEY);

// Initialize OpenAI client with configuration from environment variables
const openai = new OpenAI({
    apiKey: process.env.API_KEY,     // API key for authentication
    baseURL: process.env.URL,        // Custom API endpoint URL
});

// Define POST endpoint for chat functionality
app.post('/api/chat', async (req, res) => {
    // Extract messages array from request body
    const { messages } = req.body;

    try {
        // Make request to OpenAI API for chat completion
        const completion = await openai.chat.completions.create({
            model: process.env.MODEL_NAME,  // Use model specified in environment variables
            messages: messages,             // Pass the conversation messages
        });
        console.log('ok');                  // Log successful API call
        res.json(completion);               // Send API response back to client
    } catch (error) {
        // Handle and log any errors that occur during API communication
        console.error('Error communicating with OpenAI API:', error);
        res.status(500).json({ error: 'Error communicating with OpenAI API' });
    }
});

// Start the server
const port = process.env.PORT || 5000;  // Use PORT from environment or default to 5000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);  // Log server start
});
