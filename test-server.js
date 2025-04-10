const express = require('express');
const app = express();
const PORT = 3001; // Different from your main app

app.get('/', (req, res) => {
  res.send('Test server is working!');
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});