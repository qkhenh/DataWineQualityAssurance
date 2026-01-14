import axios from "../lib/axios";

const submitTestResult = async (data) => {
  return await axios.post("/test/submit", data);
};

const getTestHistory = async () => {
  const response = await axios.get("/test/history");
  return response.data;
};

const testService = {
  submitTestResult,
  getTestHistory,
};

export default testService;
