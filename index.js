const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, etc.)
app.use(express.static('public'));

// Endpoint to fetch teams
app.get('/teams', (req, res) => {
  fs.readFile('teams.txt', 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading teams file');
    }
    res.json(data.split('\n').filter(Boolean)); // Send non-empty lines as JSON
  });
});

// Endpoint to fetch leagues
app.get('/leagues', (req, res) => {
  fs.readFile('leagues.txt', 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading leagues file');
    }
    res.json(data.split('\n').filter(Boolean)); // Send non-empty lines as JSON
  });
});

// Endpoint to serve navbar.html dynamically
app.get('/navbar.html', (req, res) => {
  fs.readFile('public/navbar.html', 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading navbar file');
    }
    res.send(data);
  });
});
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
