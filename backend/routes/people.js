const express = require('express');
const { fetchPeople } = require('../fetchData');
const router = express.Router();

router.get('/people', async (req, res) => {
  try {
    const people = await fetchPeople();
    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

module.exports = router;