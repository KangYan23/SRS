import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    const { category, priority, completed } = req.query;
    const query = {};
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (completed !== undefined) query.completed = completed === "true";

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: tasks });
  }

  if (req.method === "POST") {
    const task = await Task.create(req.body);
    return res.status(201).json({ success: true, data: task });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}