// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const Post = require('./models/Post'); // Import the Post model

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
// Allow requests from your frontend's domain (assuming it's running locally on another port, like 5500)
// You may need to change this if your frontend is hosted elsewhere.
const corsOptions = {
    origin: 'http://127.0.0.1:5500', 
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json()); // Body parser for JSON data

// ---------------------- DATABASE CONNECTION ----------------------
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---------------------- API ROUTES ----------------------

// 1. GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    // Sort by createdAt in descending order (newest first)
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
});

// 2. CREATE a new post
app.post('/api/posts', async (req, res) => {
  try {
    const newPost = await Post.create(req.body);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: 'Invalid post data', error: err.message });
  }
});

// 3. UPDATE an existing post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the updated document
      runValidators: true // Run schema validators
    });

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: 'Error updating post', error: err.message });
  }
});

// 4. DELETE a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(204).json({ message: 'Post deleted successfully' }); // 204 No Content
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
});

// 5. SEARCH/FILTER posts (Integrates with your frontend search)
app.get('/api/posts/search', async (req, res) => {
    try {
        const { qry } = req.query; // Search query from URL: /api/posts/search?qry=coding
        if (!qry) {
            return res.status(400).json({ message: 'Search query (qry) is required' });
        }

        const regex = new RegExp(qry, 'i'); // Case-insensitive search

        const posts = await Post.find({
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } },
                { category: { $regex: regex } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({ message: 'Error searching posts', error: err.message });
    }
});


// ---------------------- START SERVER ----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the backend at http://localhost:${PORT}`);
});