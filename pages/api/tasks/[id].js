import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (req.method === "PUT") {
    const updates = { ...req.body };
    if (updates.completed === true && !updates.completedAt) {
      updates.completedAt = new Date();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }
    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    return res.status(200).json({ success: true, data: task });
  }

  if (req.method === "DELETE") {
    await Task.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}