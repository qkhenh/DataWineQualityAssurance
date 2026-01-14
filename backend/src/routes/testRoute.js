import express from 'express';
import { submitTestResult, getTestHistory } from '../controllers/testController.js';

const router = express.Router();

router.post('/submit', submitTestResult);
router.get('/history', getTestHistory);

export default router;
