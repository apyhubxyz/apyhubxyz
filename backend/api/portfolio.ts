// Sample portfolio endpoint stub
import express from 'express';
const router = express.Router();

router.get('/:address', (req, res) => {
  res.json({ totalValue: 10000, positions: [] });
});

export default router;
