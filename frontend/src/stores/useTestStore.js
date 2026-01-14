import { create } from "zustand";
import testService from "../Services/testService";
import { toast } from "sonner";

const useTestStore = create((set) => ({
  isSubmitting: false,
  testHistory: [],
  loadingHistory: false,

  submitTestResult: async (data) => {
    set({ isSubmitting: true });
    try {
      await testService.submitTestResult(data);
      toast.success("Test result submitted successfully");
      // Refresh history after submission
      const history = await testService.getTestHistory();
      set({ testHistory: history });
    } catch (error) {
      console.error("Submit test result error:", error);
      toast.error(error.response?.data?.message || "Failed to submit test result");
    } finally {
      set({ isSubmitting: false });
    }
  },

  fetchTestHistory: async () => {
    set({ loadingHistory: true });
    try {
      const history = await testService.getTestHistory();
      set({ testHistory: history });
    } catch (error) {
      console.error("Fetch test history error:", error);
      toast.error("Failed to fetch test history");
    } finally {
      set({ loadingHistory: false });
    }
  },
}));

export default useTestStore;
