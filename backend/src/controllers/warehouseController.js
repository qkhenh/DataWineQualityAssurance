import { 
  createWarehouse as createWarehouseModel, 
  getWarehouseByToken, 
  updateWarehouseToken,
  getWarehouseById,
  getWarehouseByOwnerId
} from '../models/Warehouse.js';
import { updateUserWarehouse, getUserById } from '../models/User.js';
import { deleteProductById, deleteProductsByBatchId } from '../models/Product.js';
import { createAlert } from '../models/Alert.js';
import crypto from 'crypto';

export const createWarehouse = async (req, res) => {
  try {
    const { categories } = req.body;
    const userId = req.user.user_id;

    if (!categories) {
      return res.status(400).json({ message: "Categories are required" });
    }

    const warehouseId = await createWarehouseModel(userId, categories);

    return res.status(201).json({ message: "Warehouse created", warehouseId });
  } catch (error) {
    console.error('Create warehouse failed', error);
    return res.status(500).json({ message: "System failed" });
  }
};

export const joinWarehouse = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.user_id;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const warehouse = await getWarehouseByToken(token);

    if (!warehouse) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    await updateUserWarehouse(userId, warehouse.warehouse_id);

    return res.status(200).json({ message: "Joined warehouse successfully", warehouseId: warehouse.warehouse_id });
  } catch (error) {
    console.error('Join warehouse failed', error);
    return res.status(500).json({ message: "System failed" });
  }
};

export const generateToken = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Check if user is owner
    const warehouse = await getWarehouseByOwnerId(userId);
    
    if (!warehouse) {
      return res.status(403).json({ message: "You are not the owner of any warehouse" });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await updateWarehouseToken(warehouse.warehouse_id, token, expiresAt);

    return res.status(200).json({ token, expiresAt });
  } catch (error) {
    console.error('Generate token failed', error);
    return res.status(500).json({ message: "System failed" });
  }
};

export const getWarehouseInfo = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = req.user;

    if (!user.warehouse_id) {
      return res.status(404).json({ message: "User does not belong to a warehouse" });
    }

    const warehouse = await getWarehouseById(user.warehouse_id);
    
    // If user is owner, include the token info
    if (warehouse.owner_id === userId) {
        return res.status(200).json({ ...warehouse, isOwner: true });
    }

    // Hide token for non-owners
    const { invitation_token, token_expires_at, ...safeWarehouse } = warehouse;
    return res.status(200).json({ ...safeWarehouse, isOwner: false });

  } catch (error) {
    console.error('Get warehouse info failed', error);
    return res.status(500).json({ message: "System failed" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const warehouseId = req.user.warehouse_id;
    const engineerId = req.user.user_id;

    if (!warehouseId) return res.status(400).json({ message: "User not in a warehouse" });

    await deleteProductById(productId);

    const title = "Product deleted!";
    const description = `Engineer ${engineerId} delete product ${productId}`;

    await createAlert({
      warehouse_id: warehouseId,
      product_id: productId,
      title,
      description
    });
    
    const io = req.app.get('io');
    if (io) {
      io.to(`warehouse_${warehouseId}`).emit('new_alert', {
        title,
        description,
        product_id: productId,
        created_at: new Date()
      });
    }

    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const warehouseId = req.user.warehouse_id;
    const engineerId = req.user.user_id;

    if (!warehouseId) return res.status(400).json({ message: "User not in a warehouse" });

    await deleteProductsByBatchId(batchId);

    const title = "Batch deleted!";
    const description = `Engineer ${engineerId} delete batch ${batchId} and its products.`;

    await createAlert({
      warehouse_id: warehouseId,
      product_id: null,
      title,
      description
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`warehouse_${warehouseId}`).emit('new_alert', {
        title,
        description,
        product_id: null,
        created_at: new Date()
      });
    }

    res.status(200).json({ message: "Batch deleted" });
  } catch (error) {
    console.error("Delete batch failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
