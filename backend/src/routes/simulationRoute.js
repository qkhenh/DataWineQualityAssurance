import express from 'express';
import { processSimulationData, getRecentSimulationData } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/data', processSimulationData);
router.get('/recent', getRecentSimulationData);

export default router;
