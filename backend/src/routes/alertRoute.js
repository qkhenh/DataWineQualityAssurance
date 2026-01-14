import express from 'express';
import { getAlerts, markRead, deleteRead, getSettings, updateSettings, deleteSetting, getAlertDetails, removeAlert, announceAlert } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', getAlerts);
router.post('/announce', announceAlert);
router.post('/read', markRead);
router.delete('/read', deleteRead);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.delete('/settings/:metric', deleteSetting);
router.get('/:alertId/details', getAlertDetails);
router.delete('/:alertId', removeAlert);

export default router;
