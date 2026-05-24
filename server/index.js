const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database simulation for demonstration
let items = [
  { id: 1, title: 'Learn Modern Web Architecture', completed: true },
  { id: 2, title: 'Build Client & Server Boilerplates', completed: false },
  { id: 3, title: 'Connect to Remote Git Repository', completed: true },
];

// Routes
// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    message: 'APL Server is up and running!'
  });
});

// 2. Get all items
app.get('/api/items', (req, res) => {
  res.json(items);
});

// 3. Create a new item
app.post('/api/items', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newItem = {
    id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
    title,
    completed: false
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// 4. Toggle item completed status
app.patch('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.completed = !item.completed;
  res.json(item);
});

// 5. Delete an item
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = items.length;
  items = items.filter(i => i.id !== id);

  if (items.length === initialLength) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json({ success: true, message: `Item with id ${id} deleted successfully` });
});

// Start the server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  APL Express Server running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
