// Sample pools endpoint stub
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json([{ id: '1', apy: 10 }]);
});

export default router;
