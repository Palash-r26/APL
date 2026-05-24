const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory Database Simulation Fallback
let isUsingMemoryDb = false;
let memoryDbWarning = '';
let memoryItems = [
  { id: '1', title: 'Learn Modern Web Architecture', completed: true },
  { id: '2', title: 'Build Client & Server Boilerplates', completed: false },
  { id: '3', title: 'Connect to Remote Git Repository', completed: true },
  { id: '4', title: 'Integrate Production MongoDB Database (Action Required: Whitelist your IP in MongoDB Atlas)', completed: false },
];

// Schema definition
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

let Item;
try {
  Item = mongoose.model('Item', itemSchema);
} catch (e) {
  Item = mongoose.model('Item');
}

// Database Connection & Bootloader
if (!MONGODB_URI) {
  console.log("==================================================================");
  console.log("⚠️  WARNING: MONGODB_URI is not defined in the environment!");
  console.log("👉 Falling back to in-memory database mode for development.");
  console.log("==================================================================");
  isUsingMemoryDb = true;
  memoryDbWarning = 'MONGODB_URI is missing from environment. Using in-memory database.';
  startExpressServer();
} else {
  console.log("Connecting to MongoDB Atlas Cluster...");
  
  // Attempt mongoose connection with a 6-second timeout so it doesn't hang indefinitely
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 6000 })
    .then(() => {
      console.log("=========================================");
      console.log("🚀 Successfully connected to MongoDB Cluster.");
      console.log("=========================================");
      seedInitialData();
      startExpressServer();
    })
    .catch(err => {
      console.log("==================================================================");
      console.log("⚠️  DATABASE CONNECTION WARNING:");
      console.log(`   ${err.message}`);
      console.log("\n💡 COMMON ROOT CAUSES:");
      console.log("   1. Your current IP address is not whitelisted in MongoDB Atlas Network Security.");
      console.log("   2. The password or connection string is incorrect.");
      console.log("\n👉 Falling back to robust in-memory database mode for now.");
      console.log("==================================================================");
      
      isUsingMemoryDb = true;
      memoryDbWarning = `Connection failed: ${err.message}. Make sure your IP is whitelisted in MongoDB Atlas!`;
      startExpressServer();
    });
}

function startExpressServer() {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  APL Express Server running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Database Status: ${isUsingMemoryDb ? 'InMemory (Fallback)' : 'MongoDB Atlas'}`);
    console.log(`========================================`);
  });
}

// Helper to seed initial data if database is empty
async function seedInitialData() {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      console.log("Seeding default database items...");
      await Item.create([
        { title: 'Learn Modern Web Architecture', completed: true },
        { title: 'Build Client & Server Boilerplates', completed: false },
        { title: 'Connect to Remote Git Repository', completed: true },
        { title: 'Integrate Production MongoDB Database (Completed)', completed: true },
      ]);
      console.log("Database seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding database:", error.message);
  }
}

// Routes
// 1. Health check endpoint (including DB status & helpful hints)
app.get('/api/health', (req, res) => {
  res.json({
    status: isUsingMemoryDb ? 'warning' : 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    database: isUsingMemoryDb ? 'in-memory-fallback' : 'mongodb-atlas',
    warning: memoryDbWarning || null,
    message: isUsingMemoryDb 
      ? 'APL Server is running with IN-MEMORY fallback database.' 
      : 'APL Server is fully connected to MongoDB Atlas!'
  });
});

// 2. Get all items
app.get('/api/items', async (req, res) => {
  if (isUsingMemoryDb) {
    return res.json(memoryItems);
  }

  try {
    const items = await Item.find().sort({ createdAt: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// 3. Create a new item
app.post('/api/items', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (isUsingMemoryDb) {
    const newItem = {
      id: String(memoryItems.length > 0 ? Math.max(...memoryItems.map(i => parseInt(i.id) || 0)) + 1 : 1),
      title,
      completed: false
    };
    memoryItems.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const newItem = new Item({ title, completed: false });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item', message: error.message });
  }
});

// 4. Toggle item completed status
app.patch('/api/items/:id', async (req, res) => {
  const { id } = req.params;

  if (isUsingMemoryDb) {
    const item = memoryItems.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    item.completed = !item.completed;
    return res.json(item);
  }

  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.completed = !item.completed;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item status', message: error.message });
  }
});

// 5. Delete an item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;

  if (isUsingMemoryDb) {
    const initialLength = memoryItems.length;
    memoryItems = memoryItems.filter(i => i.id !== id);

    if (memoryItems.length === initialLength) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json({ success: true, message: `Item deleted successfully` });
  }

  try {
    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: `Item deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item', message: error.message });
  }
});
