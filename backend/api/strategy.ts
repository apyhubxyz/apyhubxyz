// Sample strategy endpoint stub
import express from 'express';
const router = express.Router();

router.post('/recommend', (req, res) => {
  res.json([{ name: 'Looping', apy: 20 }]);
});

export default router;
