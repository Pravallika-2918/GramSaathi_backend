const ServiceCenter = require('../models/ServiceCenter');
const axios = require('axios');

// @desc    Get nearby service centers
// @route   GET /api/service-centers/nearby
// @access  Private
const getNearbyCenters = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 50000, type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude.' });
    }

    // Query MongoDB for nearby centers using 2dsphere index
    const query = {
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: rad,
        },
      },
    };

    if (type) query.type = type;

    let centers = await ServiceCenter.find(query).limit(20);

    // If no DB results, try Google Places API
    if (centers.length === 0 && process.env.GOOGLE_MAPS_API_KEY) {
      const googleCenters = await fetchFromGooglePlaces(lat, lng, type, rad);
      return res.status(200).json({
        success: true,
        count: googleCenters.length,
        centers: googleCenters,
        source: 'google',
      });
    }

    // Add distance field manually for display
    const centersWithDistance = centers.map((center) => {
      const centerObj = center.toObject();
      const [cLng, cLat] = center.location.coordinates;
      const distance = calculateDistance(lat, lng, cLat, cLng);
      return { ...centerObj, distanceKm: parseFloat(distance.toFixed(2)) };
    });

    res.status(200).json({
      success: true,
      count: centersWithDistance.length,
      centers: centersWithDistance,
      source: 'database',
      searchLocation: { latitude: lat, longitude: lng, radiusKm: rad / 1000 },
    });
  } catch (error) {
    // Handle index not ready error gracefully
    if (error.code === 16755 || error.message?.includes('2dsphere')) {
      return res.status(200).json({
        success: true,
        count: 0,
        centers: [],
        message: 'Location index not ready. Please try again.',
        source: 'database',
      });
    }
    next(error);
  }
};

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const fetchFromGooglePlaces = async (lat, lng, type, radius) => {
  try {
    const keywords = {
      'MeeSeva': 'MeeSeva center',
      'Government Office': 'government office',
      'Hospital': 'government hospital',
      'Bank': 'bank branch',
      'Agriculture Office': 'agriculture office',
      'Scholarship Help Center': 'scholarship help center',
    };

    const keyword = keywords[type] || 'government service center';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.status !== 'OK') return [];

    return response.data.results.map((place) => ({
      _id: place.place_id,
      name: place.name,
      type: type || 'Government Office',
      address: place.vicinity,
      location: {
        type: 'Point',
        coordinates: [place.geometry.location.lng, place.geometry.location.lat],
      },
      rating: place.rating || 0,
      isOpen: place.opening_hours?.open_now ?? null,
      placeId: place.place_id,
      distanceKm: parseFloat(
        calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng).toFixed(2)
      ),
      source: 'google',
    }));
  } catch (error) {
    console.error('Google Places API error:', error.message);
    return [];
  }
};

// @desc    Get place details from Google Maps
// @route   GET /api/service-centers/place/:placeId
// @access  Private
const getPlaceDetails = async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(400).json({ success: false, message: 'Google Maps API not configured.' });
    }

    const { placeId } = req.params;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,website,geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url, { timeout: 5000 });
    res.status(200).json({ success: true, place: response.data.result });
  } catch (error) { next(error); }
};

// @desc    Get all service centers with filters
// @route   GET /api/service-centers
// @access  Public
const getServiceCenters = async (req, res, next) => {
  try {
    const {
      search, type, state, district,
      page = 1, limit = 12,
      sortBy = 'rating', sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (state) query.state = { $regex: state, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [centers, total] = await Promise.all([
      ServiceCenter.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum),
      ServiceCenter.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: centers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      centers,
    });
  } catch (error) { next(error); }
};

// Admin CRUD
const createServiceCenter = async (req, res, next) => {
  try {
    const center = await ServiceCenter.create(req.body);
    res.status(201).json({ success: true, message: 'Service center created.', center });
  } catch (error) { next(error); }
};

const updateServiceCenter = async (req, res, next) => {
  try {
    const center = await ServiceCenter.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!center) return res.status(404).json({ success: false, message: 'Center not found.' });
    res.status(200).json({ success: true, message: 'Center updated.', center });
  } catch (error) { next(error); }
};

const deleteServiceCenter = async (req, res, next) => {
  try {
    await ServiceCenter.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Service center deactivated.' });
  } catch (error) { next(error); }
};

module.exports = {
  getNearbyCenters,
  getPlaceDetails,
  getServiceCenters,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
};