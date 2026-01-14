import express from 'express';
import { createWarehouse, joinWarehouse, generateToken, getWarehouseInfo, deleteProduct, deleteBatch } from '../controllers/warehouseController.js';

const router = express.Router();

router.post('/create', createWarehouse);
router.post('/join', joinWarehouse);
router.post('/token', generateToken);
router.get('/', getWarehouseInfo);
router.delete('/product/:productId', deleteProduct);
router.delete('/batch/:batchId', deleteBatch);

export default router;
