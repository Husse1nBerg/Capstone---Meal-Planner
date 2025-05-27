//main file

const express = require('express');
const axios = require('axios');
const path = require('path');// Importing path module, which helps you work with file and directory paths in a way that works on any operating system
const apiRoutes = require('./routes/apiRoutes');// Importing the API routes defined in a separate file
const session = require('express-session');// Importing express-session for session management


const app = express();
const PORT = process.env.PORT || 3000;// Setting the port for the server to listen on, defaulting to 3000 if not specified in the environment variables

// Middleware
app.use(express.static(path.join(__dirname, 'public')));// Serving static files from the 'public' directory
app.use(express.urlencoded({ extended: true }));// Parsing URL-encoded bodies (form submissions). “If someone submits a form using application/x-www-form-urlencoded (the default for HTML forms), please parse the data and put it in req.body so I can use it.”
app.use(express.json()); // Parsing JSON bodies (for API requests). “If someone sends a JSON payload, please parse it and put it in req.body so I can use it.”



app.use(session({    // Configuring session middleware
  secret: 'mealplanner-secret', // Secret key for signing the session ID cookie
  resave: false, // Don't save session if unmodified
  saveUninitialized: true // Save uninitialized sessions (new sessions that are not modified)
}));

// Set EJS
app.set('view engine', 'ejs');

// Routes
app.use('/', apiRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); // link to local server
