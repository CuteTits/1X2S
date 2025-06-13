const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Get card list
app.get('/api/cards', (req, res) => {
  const cardsDirectory = path.join(__dirname, 'public', 'page-card-1');
  console.log('Reading from:', cardsDirectory);

  if (!fs.existsSync(cardsDirectory)) {
    console.error('Directory missing:', cardsDirectory);
    return res.status(500).send('Cards directory does not exist');
  }

  fs.readdir(cardsDirectory, (err, files) => {
    if (err) {
      console.error('Error reading cards:', err);
      return res.status(500).send('Error reading the cards directory');
    }

    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        src: `/page-card-1/${file}`
      }));

    console.log('Serving card list:', jsonFiles);
    res.json(jsonFiles);
  });
});

// Serve navbar.html
app.get('/navbar.html', (req, res) => {
  fs.readFile('public/navbar.html', 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading navbar file');
    }
    res.send(data);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
