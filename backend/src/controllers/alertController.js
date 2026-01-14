import { 
  getAlertsByWarehouse, 
  getUnreadAlertCount, 
  markAlertAsRead, 
  updateAlertReadStatus,
  markAllAlertsAsRead,
  deleteReadAlerts,
  getAlertSettings,
  upsertAlertSetting,
  deleteAlertSetting,
  getAlertById,
  deleteAlert,
  createAlert
} from '../models/Alert.js';
import { getProductDetails, getAverageMetric } from '../models/Product.js';

export const getAlerts = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    if (!warehouseId) return res.status(400).json({ message: "User not in a warehouse" });

    const alerts = await getAlertsByWarehouse(warehouseId);
    const unreadCount = await getUnreadAlertCount(warehouseId);

    res.status(200).json({ alerts, unreadCount });
  } catch (error) {
    console.error("Get alerts failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markRead = async (req, res) => {
  try {
    const { alertId, isRead } = req.body;
    if (alertId) {
      if (isRead !== undefined) {
        await updateAlertReadStatus(alertId, isRead);
      } else {
        await markAlertAsRead(alertId);
      }
    } else {
      const warehouseId = req.user.warehouse_id;
      await markAllAlertsAsRead(warehouseId);
    }
    res.status(200).json({ message: "Updated alert status" });
  } catch (error) {
    console.error("Mark read failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRead = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    await deleteReadAlerts(warehouseId);
    res.status(200).json({ message: "Deleted read alerts" });
  } catch (error) {
    console.error("Delete read alerts failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSettings = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    if (!warehouseId) return res.status(400).json({ message: "User not in a warehouse" });

    const settings = await getAlertSettings(warehouseId);
    res.status(200).json(settings);
  } catch (error) {
    console.error("Get settings failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    const { settings } = req.body; // Array of { metric, min, max, enabled }

    console.log(`[Update Settings] User: ${req.user.username}, WarehouseID: ${warehouseId}`);
    console.log(`[Update Settings] Payload:`, JSON.stringify(settings));

    if (!warehouseId) {
        return res.status(400).json({ message: "User not in a warehouse" });
    }

    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: "Invalid settings format" });
    }

    for (const setting of settings) {
      await upsertAlertSetting(
        warehouseId, 
        setting.metric, 
        setting.min, 
        setting.max, 
        setting.enabled
      );
    }

    res.status(200).json({ message: "Settings updated" });
  } catch (error) {
    console.error("Update settings failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSetting = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    const { metric } = req.params;
    await deleteAlertSetting(warehouseId, metric);
    res.status(200).json({ message: "Setting deleted" });
  } catch (error) {
    console.error("Delete setting failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await getAlertById(alertId);
    
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    const product = await getProductDetails(alert.product_id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Infer metric from title (e.g., "pH Alert" -> "pH")
    // Or from description if title is generic
    let metric = null;
    if (alert.title && alert.title.endsWith(' Alert')) {
      metric = alert.title.replace(' Alert', '');
    }

    let lineAvg = null;
    let batchAvg = null;

    if (metric) {
      try {
        lineAvg = await getAverageMetric(metric, 'line_id', product.line_id);
        batchAvg = await getAverageMetric(metric, 'batch_id', product.batch_id);
      } catch (e) {
        console.warn(`Could not calculate average for metric ${metric}: ${e.message}`);
      }
    }

    res.status(200).json({
      alert,
      product,
      lineAvg,
      batchAvg,
      metric
    });

  } catch (error) {
    console.error("Get alert details failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    await deleteAlert(alertId);
    res.status(200).json({ message: "Alert deleted" });
  } catch (error) {
    console.error("Delete alert failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const announceAlert = async (req, res) => {
  try {
    const { title, description, productId } = req.body;
    const warehouseId = req.user.warehouse_id;

    if (!warehouseId) return res.status(400).json({ message: "User not in a warehouse" });

    await createAlert({
      warehouse_id: warehouseId,
      product_id: productId || null,
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

    res.status(201).json({ message: "Alert announced successfully" });
  } catch (error) {
    console.error("Announce alert failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
