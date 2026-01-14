import express from 'express';
import { 
  getAuditLogs, 
  getAuditLogDetail, 
  addAuditLog, 
  removeAuditLog 
} from '../controllers/auditLogController.js';

const router = express.Router();

router.get('/', getAuditLogs);
router.get('/:logId', getAuditLogDetail);
router.post('/', addAuditLog);
router.delete('/:logId', removeAuditLog);

export default router;
