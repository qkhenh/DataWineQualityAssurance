import express from 'express';
import { 
    getWarehouseStats, 
    getLinesStatus, 
    getActiveBatches, 
    getRecentProducts,
    getComparisonData,
    getAlertsByDate,
    getTesterComparisons
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getWarehouseStats);
router.get('/lines', getLinesStatus);
router.get('/batches', getActiveBatches);
router.get('/products', getRecentProducts);
router.get('/comparison', getComparisonData);
router.get('/alerts-calendar', getAlertsByDate);
router.get('/tester-comparisons', getTesterComparisons);

export default router;
