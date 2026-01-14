import {
  getAuditLogsByWarehouse,
  getAuditLogById,
  createAuditLog,
  deleteAuditLog
} from '../models/AuditLog.js';

import { pool } from '../libs/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    if (!warehouseId) {
      return res.status(400).json({ message: "User not in a warehouse" });
    }

    const logs = await getAuditLogsByWarehouse(warehouseId);
    res.status(200).json({ logs });
  } catch (error) {
    console.error("Get audit logs failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAuditLogDetail = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await getAuditLogById(logId);
    
    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.status(200).json({ log });
  } catch (error) {
    console.error("Get audit log detail failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addAuditLog = async (req, res) => {
  try {
    const warehouseId = req.user.warehouse_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;
    const { event, description } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ message: "User not in a warehouse" });
    }

    if (!event) {
      return res.status(400).json({ message: "Event title is required" });
    }

    // Only pass engineer_id if the user is an engineer, otherwise null
    // This is because the foreign key constraint requires engineer_id to reference the engineer table
    let engineerId = null;
    if (userRole === 'engineer') {
      engineerId = userId;
      // Self-healing: Check if engineer exists, if not create it
      const [engineers] = await pool.query('SELECT user_id FROM engineer WHERE user_id = ?', [userId]);
      if (engineers.length === 0) {
        await pool.query('INSERT INTO engineer (user_id, expertise) VALUES (?, ?)', [userId, 'General']);
      }
    }

    const newLog = await createAuditLog(event, description || '', warehouseId, engineerId);
    
    res.status(201).json({ message: "Audit log created", log: newLog });
  } catch (error) {
    console.error("Add audit log failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeAuditLog = async (req, res) => {
  try {
    const { logId } = req.params;
    await deleteAuditLog(logId);
    res.status(200).json({ message: "Audit log deleted" });
  } catch (error) {
    console.error("Delete audit log failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
