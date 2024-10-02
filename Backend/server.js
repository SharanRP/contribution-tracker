const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// Supabase client initialization
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors({
    origin: 'http://localhost:3000', // Replace with your frontend URL
    credentials: true
}));
app.use(express.json());

// Single admin user
const adminUser = {
    email: 'adminpanel1@gmail.com',
    password: 'inheritance24'
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (decoded.email === adminUser.email) {
        next();
      } else {
        console.log('Unauthorized access attempt:', decoded.email);
        res.status(403).json({ error: 'Unauthorized' });
      }
    });
};

// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);

    if (email === adminUser.email && password === adminUser.password) {
        console.log('Login successful');
        const token = jwt.sign({ email: adminUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { email: adminUser.email, role: 'admin' } });
    } else {
        console.log('Invalid credentials');
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

// Routes
app.get('/api/repositories', async (req, res) => {
  const { startDate, endDate } = req.query;
  res.json(repositoriesData);
});

app.get('/api/leaderboard', async (req, res) => {
  // Fetch leaderboard data from Supabase
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.get('/api/announcements', async (req, res) => {
  // Fetch announcements from Supabase
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.post('/api/announcements', isAdmin, async (req, res) => {
    const { content } = req.body;
    console.log('Announcement request:', req.body);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ content })
        .select();
  
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message || 'Failed to post announcement' });
      }
      res.json(data);
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  });

  app.get('/api/test-supabase', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .limit(1);
  
      if (error) {
        console.error('Supabase test error:', error);
        return res.status(500).json({ error: error.message || 'Supabase test failed' });
      }
      res.json({ message: 'Supabase connection successful', data });
    } catch (err) {
      console.error('Server test error:', err);
      res.status(500).json({ error: 'An unexpected error occurred during Supabase test' });
    }
  });

  app.get('/api/test-insert', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ content: 'Test announcement' })
        .select();
  
      if (error) {
        console.error('Supabase test insert error:', error);
        return res.status(500).json({ error: error.message || 'Test insert failed' });
      }
      res.json({ message: 'Test insert successful', data });
    } catch (err) {
      console.error('Server test insert error:', err);
      res.status(500).json({ error: 'An unexpected error occurred during test insert' });
    }
  });
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});