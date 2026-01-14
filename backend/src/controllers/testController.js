import { insertTestResult, getTestHistoryByTesterId } from '../models/TestRandom.js';

export const submitTestResult = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId, score, description } = req.body;
    const testerId = req.user.user_id;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: "Valid Product ID is required" });
    }
    if (score === undefined || score === null || isNaN(score)) {
      return res.status(400).json({ message: "Valid Score is required" });
    }

    await insertTestResult(testerId, productId, score, description);

    res.status(201).json({ message: "Test result submitted successfully" });
  } catch (error) {
    console.error("Submit test result failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTestHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const testerId = req.user.user_id;
    const history = await getTestHistoryByTesterId(testerId);

    res.status(200).json(history);
  } catch (error) {
    console.error("Get test history failed", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
