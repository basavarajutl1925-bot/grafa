const express = require('express');
const { getDistrictFromCoordinates, getAllDistricts } = require('../utils/location');

const router = express.Router();

/**
 * Get district from coordinates
 */
router.post('/district', (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude, longitude required' });
    }

    const district = getDistrictFromCoordinates(latitude, longitude);

    if (!district) {
      return res.status(404).json({ error: 'District not found for given coordinates' });
    }

    res.json({ district: district.name, key: district.key, distance: district.distance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all available districts
 */
router.get('/districts', (req, res) => {
  try {
    const districts = getAllDistricts();
    res.json({ districts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
