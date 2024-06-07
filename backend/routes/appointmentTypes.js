const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.API_KEY || 'your_api_key_here';
const SYSTEM_KEY = process.env.SYSTEM_KEY || 'your_system_key_here';

router.get('/appointment-types', async (req, res) => {
  try {
    const response = await axios.get('https://api.followupboss.com/v1/appointment-types', {
      headers: {
        'X-System': 'AS',
        'X-System-Key': SYSTEM_KEY,
      },
      auth: {
        username: API_KEY,
        password: '',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    res.status(500).json({ error: 'Failed to fetch appointment types' });
  }
});

module.exports = router;