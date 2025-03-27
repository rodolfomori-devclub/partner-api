const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Rota para buscar parceiros com filtros
router.get('/partners', searchController.searchPartners);

// Rota para buscar parceiros próximos
router.get('/nearby', searchController.searchNearby);

module.exports = router;