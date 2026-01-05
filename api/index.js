// Core server dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const profileSchema = new mongoose.Schema({
  profileName: String,
  data: Array
});
const Profile = mongoose.model('Profile', profileSchema);

// Root route (VERY IMPORTANT for Vercel)
app.get("/", (req, res) => {
  res.json({ message: "DataAkamuthu backend is running 🚀" });
});

// GET /api/profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find();
    const summary = profiles.map(profile => {
      const sortedData = profile.data.sort(
        (a, b) => new Date(b.timestamp.$date) - new Date(a.timestamp.$date)
      );
      const latest = sortedData[0];
      return {
        id: profile._id,
        name: profile.profileName,
        latestCoords: latest ? latest.coordinates : [0, 0],
        latestTimestamp: latest ? latest.timestamp.$date : null
      };
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profiles' });
  }
});

// GET /api/profiles/:id/data
app.get('/api/profiles/:id/data', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const sortedData = profile.data.sort(
      (a, b) => new Date(a.timestamp.$date) - new Date(b.timestamp.$date)
    );
    res.json(sortedData);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// EXPORT (instead of listen)
module.exports = app;
