import { pool } from '../libs/db.js';

export const getWarehouseStats = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        
        if (!warehouseId) {
            return res.status(400).json({ message: 'User not attached to a warehouse' });
        }

        const [warehouses] = await pool.query('SELECT * FROM warehouse WHERE warehouse_id = ?', [warehouseId]);
        const warehouse = warehouses[0];

        if (!warehouse) {
            return res.status(404).json({ message: 'Warehouse not found' });
        }

        const [linesCount] = await pool.query('SELECT COUNT(*) as count FROM line WHERE warehouse_id = ?', [warehouse.warehouse_id]);
        
        const [batchesCount] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM batches b
            JOIN line l ON b.line_id = l.line_id
            WHERE l.warehouse_id = ?
        `, [warehouse.warehouse_id]);

        const [productsCount] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM product p
            JOIN batches b ON p.batch_id = b.batch_id
            JOIN line l ON b.line_id = l.line_id
            WHERE l.warehouse_id = ?
        `, [warehouse.warehouse_id]);
        
        // Active lines: Lines that have produced something in the last 24 hours
        // Or simply lines that have an active batch. Let's say lines that have a batch with quantity > 0 and recent product?
        // For simplicity, let's count lines that have entries in 'batches' table.
        // Better: Lines that are in the 'line' table are considered installed. 
        // Active lines could be those with recent activity.
        // Let's query lines that have a batch created in the last 7 days.
        const [activeLines] = await pool.query(`
            SELECT COUNT(DISTINCT b.line_id) as count 
            FROM batches b
            JOIN line l ON b.line_id = l.line_id
            WHERE l.warehouse_id = ? AND b.producted_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [warehouse.warehouse_id]);

        // Calculate testing stats
        const [testingStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_tested,
                AVG(ABS(tr.score - ip.quality_score)) as avg_diff,
                SUM(CASE WHEN ABS(tr.score - ip.quality_score) <= 1 THEN 1 ELSE 0 END) as count_within_1,
                SUM(CASE WHEN ABS(tr.score - ip.quality_score) <= 3 THEN 1 ELSE 0 END) as count_within_3,
                COUNT(ip.quality_score) as total_with_prediction
            FROM test_random tr
            JOIN product p ON tr.product_id = p.product_id
            LEFT JOIN is_predicted ip ON tr.product_id = ip.product_id
            WHERE p.warehouse_id = ?
        `, [warehouse.warehouse_id]);

        const stats = testingStats[0];
        const totalWithPrediction = stats.total_with_prediction || 0;
        const accuracy1 = totalWithPrediction > 0 ? (stats.count_within_1 / totalWithPrediction) * 100 : 0;
        const accuracy3 = totalWithPrediction > 0 ? (stats.count_within_3 / totalWithPrediction) * 100 : 0;

        res.json({
            warehouse_id: warehouse.warehouse_id,
            categories: warehouse.categories,
            total_lines: linesCount[0].count,
            active_lines: activeLines[0].count,
            total_batches: batchesCount[0].count,
            total_products: productsCount[0].count,
            testing_stats: {
                total_tested: stats.total_tested,
                avg_diff: stats.avg_diff !== null ? parseFloat(stats.avg_diff).toFixed(2) : 0,
                accuracy_1: accuracy1.toFixed(1),
                accuracy_3: accuracy3.toFixed(1)
            }
        });
    } catch (error) {
        console.error('Error fetching warehouse stats:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getLinesStatus = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        const [lines] = await pool.query('SELECT * FROM line WHERE warehouse_id = ?', [warehouseId]);
        
        const linesData = await Promise.all(lines.map(async (line) => {
            // Get sensor count
            const [sensors] = await pool.query('SELECT COUNT(*) as count FROM sensors WHERE line_id = ?', [line.line_id]);
            
            // Get current/latest batch
            const [latestBatch] = await pool.query('SELECT * FROM batches WHERE line_id = ? ORDER BY producted_date DESC LIMIT 1', [line.line_id]);
            
            // Get products produced today (using is_predicted timestamp as proxy for production time if available, or batches date)
            // Since product table doesn't have timestamp, we rely on is_predicted or batches.
            // Let's use is_predicted joined with product and batches.
            const [productsToday] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM is_predicted ip
                JOIN product p ON ip.product_id = p.product_id
                JOIN batches b ON p.batch_id = b.batch_id
                WHERE b.line_id = ? AND DATE(ip.time_predict) = CURDATE()
            `, [line.line_id]);

            return {
                line_id: line.line_id,
                active_date: line.active_date,
                status: latestBatch.length > 0 ? 'active' : 'inactive', // Simple logic
                warehouse_id: line.warehouse_id,
                current_batch: latestBatch.length > 0 ? `Batch #${latestBatch[0].batch_id}` : null,
                sensors_count: sensors[0].count,
                products_today: productsToday[0].count
            };
        }));

        res.json(linesData);
    } catch (error) {
        console.error('Error fetching lines status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getActiveBatches = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        // Get recent batches (e.g., last 20)
        const [batches] = await pool.query(`
            SELECT b.*, l.warehouse_id 
            FROM batches b
            JOIN line l ON b.line_id = l.line_id
            WHERE l.warehouse_id = ?
            ORDER BY b.producted_date DESC 
            LIMIT 20
        `, [warehouseId]);

        const batchesData = await Promise.all(batches.map(async (batch) => {
            // Calculate average quality score
            const [avgQuality] = await pool.query(`
                SELECT AVG(ip.quality_score) as avg_score
                FROM is_predicted ip
                JOIN product p ON ip.product_id = p.product_id
                WHERE p.batch_id = ?
            `, [batch.batch_id]);

            return {
                batch_id: batch.batch_id,
                batch_name: `Batch #${batch.batch_id}`,
                line_id: batch.line_id,
                start_date: batch.producted_date,
                status: 'in_progress', // You might want to derive this from date or quantity
                products_count: batch.quantity,
                quality_score: avgQuality[0].avg_score ? parseFloat(avgQuality[0].avg_score.toFixed(1)) : 0
            };
        }));

        res.json(batchesData);
    } catch (error) {
        console.error('Error fetching active batches:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getRecentProducts = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        const [products] = await pool.query(`
            SELECT 
                p.product_id, 
                p.batch_id, 
                p.alcohol, 
                p.pH, 
                ip.quality_score, 
                ip.time_predict as timestamp
            FROM product p
            JOIN is_predicted ip ON p.product_id = ip.product_id
            WHERE p.warehouse_id = ?
            ORDER BY ip.time_predict DESC
            LIMIT 20
        `, [warehouseId]);

        const productsData = products.map(p => ({
            product_id: p.product_id,
            batch_id: p.batch_id,
            alcohol: p.alcohol,
            pH: p.pH,
            quality_status: p.quality_score >= 7 ? 'good' : (p.quality_score >= 5 ? 'warning' : 'error'),
            timestamp: p.timestamp
        }));

        res.json(productsData);
    } catch (error) {
        console.error('Error fetching recent products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getComparisonData = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        const { period } = req.query; // 'week', 'month', 'year'

        let groupBy = '';
        let dateFilter = '';
        let dateFormat = '';

        if (period === 'week') {
            dateFilter = 'DATE(ip.time_predict) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            groupBy = "DATE_FORMAT(ip.time_predict, '%Y-%m-%d')";
            dateFormat = '%Y-%m-%d';
        } else if (period === 'month') {
            dateFilter = 'DATE(ip.time_predict) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            groupBy = "DATE_FORMAT(ip.time_predict, '%Y-%m-%d')";
            dateFormat = '%Y-%m-%d';
        } else if (period === 'year') {
            dateFilter = 'DATE(ip.time_predict) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
            groupBy = 'DATE_FORMAT(ip.time_predict, "%Y-%m")';
            dateFormat = '%Y-%m';
        } else {
            return res.status(400).json({ message: 'Invalid period' });
        }

        const [data] = await pool.query(`
            SELECT 
                DATE_FORMAT(ip.time_predict, ?) as date,
                AVG(ip.quality_score) as avg_quality,
                COUNT(*) as production_count
            FROM is_predicted ip
            JOIN product p ON ip.product_id = p.product_id
            WHERE p.warehouse_id = ? AND ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY date ASC
        `, [dateFormat, warehouseId]);

        res.json(data);
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getAlertsByDate = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        // Get alerts for the last 3 months for the calendar
        const [alerts] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM alerts
            WHERE warehouse_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY DATE(created_at)
        `, [warehouseId]);

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts by date:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getTesterComparisons = async (req, res) => {
    try {
        const warehouseId = req.user.warehouse_id;
        
        const [rows] = await pool.query(`
            SELECT 
                u.username as tester_name,
                tr.tester_id,
                tr.product_id,
                tr.score as tester_score,
                ip.quality_score as model_score
            FROM test_random tr
            JOIN users u ON tr.tester_id = u.user_id
            LEFT JOIN is_predicted ip ON tr.product_id = ip.product_id
            JOIN product p ON tr.product_id = p.product_id
            WHERE p.warehouse_id = ?
            ORDER BY tr.created_at DESC
            LIMIT 50
        `, [warehouseId]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching tester comparisons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
