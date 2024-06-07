const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.API_KEY || 'your_api_key_here';
const SYSTEM_KEY = process.env.SYSTEM_KEY || 'your_system_key_here';

router.get('/users', async (req, res) => {
  try {
    let users = {};
    let url = 'https://api.followupboss.com/v1/users?limit=100';
    let fetchMore = true;

    while (fetchMore) {
      const response = await axios.get(url, {
        headers: {
          'X-System': 'AS',
          'X-System-Key': SYSTEM_KEY,
        },
        auth: {
          username: API_KEY,
          password: '',
        },
      });

      const fetchedUsers = response.data.users;

      if (fetchedUsers && fetchedUsers.length > 0) {
        fetchedUsers.forEach(user => {
          users[user.id] = user.name;
        });
      }

      if (response.data._metadata && response.data._metadata.next) {
        url = response.data._metadata.next;
      } else {
        fetchMore = false;
      }
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;