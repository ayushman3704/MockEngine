// const express = require('express');
// const {generateMockData} = require('../controllers/mockController');

// const router = express.Router();


// router.get("/mocker/:userId/:projectSlug/{*wildcard}", generateMockData);

// module.exports = router;


const express = require('express');
const { generateMockData } = require('../controllers/mockController');

const router = express.Router();

// 🚀 THE FIX: router.use() catches the base URL and passes the leftover nested folders directly to the controller!
router.use("/:userId/:projectId", generateMockData);

module.exports = router;

