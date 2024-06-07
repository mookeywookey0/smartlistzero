const express = require('express');
const axios = require('axios');
const router = express.Router();
const API_KEY = process.env.API_KEY || 'your_api_key_here';
const SYSTEM_KEY = process.env.SYSTEM_KEY || 'your_system_key_here';

const headers = {
  'X-System': 'AS',
  'X-System-Key': SYSTEM_KEY,
};

// Fetch all appointments with optional date filters
router.get('/appointments', async (req, res) => {
  const { startDate, endDate } = req.query; // Optional query parameters for date filtering
  try {
    const allAppointments = [];
    let url = `https://api.followupboss.com/v1/appointments?limit=100${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
    let fetchMore = true;
    let totalAppointments = 0;

    console.log('Starting fetch process'); // Initial log

    while (fetchMore) {
      console.log(`Fetching URL: ${url}`); // Log the URL being fetched
      const response = await axios.get(url, {
        headers,
        auth: { username: API_KEY, password: '' },
      });

      console.log('Response data:', response.data);

      const appointments = response.data.appointments;
      allAppointments.push(...appointments);

      // Check and log metadata
      if (response.data._metadata) {
        console.log(`Metadata: ${JSON.stringify(response.data._metadata)}`);
        if (totalAppointments === 0) {
          totalAppointments = response.data._metadata.total;
        }
      }

      // Check for next link in the metadata for pagination
      if (response.data._metadata && response.data._metadata.next) {
        url = `https://api.followupboss.com/v1/appointments?next=${response.data._metadata.next}`;
      } else {
        fetchMore = false;
      }
    }

    // Log the final results
    console.log(`Total Appointments: ${totalAppointments}`);
    console.log(`Fetched Appointments: ${allAppointments.length}`);

    // Handle the case when no appointments are found
    if (allAppointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found matching the criteria' });
    }

    res.json({ appointments: allAppointments, total: totalAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;