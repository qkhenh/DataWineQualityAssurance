import axios from 'axios';
import { storeProduct, getRecentProducts } from '../models/Product.js';
import { getAlertSettings, createAlert } from '../models/Alert.js';

export const getRecentSimulationData = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const warehouseId = req.query.warehouse_id ? parseInt(req.query.warehouse_id) : null;
        const data = await getRecentProducts(limit, warehouseId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching recent data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const processSimulationData = async (req, res) => {
    try {
        const inputData = req.body;
        const io = req.app.get('io');

        console.log("Received simulation data:", inputData);

        // 1. Call AI Service
        // Assuming AI service is running locally on port 8000
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
        
        let prediction = null;
        try {
            const aiResponse = await axios.post(`${aiServiceUrl}/predict`, inputData);
            prediction = aiResponse.data;
            console.log("[AI Service] Prediction received:", prediction);
        } catch (aiError) {
            console.error("Error calling AI service:", aiError.message);
            // We can still proceed without prediction or return error
            // For now, let's return error to the simulation script
            return res.status(502).json({ message: "AI Service Unavailable", error: aiError.message });
        }

        // 2. Store Data in Database
        try {
            await storeProduct(inputData, prediction);
        } catch (dbError) {
            console.error("Database storage failed:", dbError);
            // Decide if we want to fail the request or just log it. 
            // Usually, if storage fails, we should probably alert.
        }

        // 2.5 Check Alerts
        try {
            const warehouseId = inputData.warehouse_id || 1;
            const settings = await getAlertSettings(warehouseId);
            
            console.log(`[Alert Check] Warehouse: ${warehouseId}, Settings count: ${settings.length}`);

            for (const setting of settings) {
                if (!setting.enabled) {
                    console.log(`[Alert Check] Skipping ${setting.metric} (Disabled)`);
                    continue;
                }
                
                let value = inputData[setting.metric];
                
                // Check prediction data if not in inputData (e.g. quality_score)
                if (value === undefined && prediction && prediction[setting.metric] !== undefined) {
                    value = prediction[setting.metric];
                }

                // Ensure value is a number
                if (value !== undefined) {
                    value = parseFloat(value);
                }
                
                console.log(`[Alert Check] Metric: ${setting.metric}, Value: ${value}, Range: [${setting.min_value}, ${setting.max_value}]`);

                if (value !== undefined && !isNaN(value)) {
                    const minVal = setting.min_value !== null ? parseFloat(setting.min_value) : null;
                    const maxVal = setting.max_value !== null ? parseFloat(setting.max_value) : null;

                    if ((minVal !== null && value < minVal) || 
                        (maxVal !== null && value > maxVal)) {
                        
                        console.log(`[Alert Check] TRIGGERED for ${setting.metric}`);

                        const alertData = {
                            warehouse_id: warehouseId,
                            product_id: inputData.product_id,
                            title: `${setting.metric} Alert`,
                            description: `Value ${value} is out of range [${setting.min_value ?? '-inf'}, ${setting.max_value ?? 'inf'}]`
                        };

                        const alertId = await createAlert(alertData);
                        console.log(`[Alert Check] Alert created in DB with ID: ${alertId}`);
                        
                        if (io) {
                            io.to(`warehouse_${warehouseId}`).emit('alert_new', { ...alertData, alert_id: alertId, created_at: new Date() });
                            console.log(`[Alert Check] Socket event emitted to room warehouse_${warehouseId}`);
                        } else {
                            console.log(`[Alert Check] Socket.io not found!`);
                        }
                    }
                }
            }
        } catch (alertError) {
            console.error("Alert processing failed:", alertError);
        }

        // 3. Combine Data
        const combinedData = {
            ...inputData,
            ...prediction,
            timestamp: new Date().toISOString()
        };

        // 4. Emit to Frontend via Socket.io
        if (io) {
            const warehouseId = inputData.warehouse_id || 1;
            io.to(`warehouse_${warehouseId}`).emit('sensor_update', combinedData);
            console.log(`Emitted sensor_update event to room warehouse_${warehouseId}`);
        } else {
            console.error("Socket.io instance not found");
        }

        // 5. Respond to Simulation Script
        res.status(200).json(combinedData);

    } catch (error) {
        console.error("Error processing simulation data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
