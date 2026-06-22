import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await connectDB();
  const result = await Task.updateMany(
    { dailyReset: true, completed: true },
    { $set: { completed: false, completedAt: null, reminderSent: false } }
  );

  return res.status(200).json({ success: true, reset: result.modifiedCount });
}