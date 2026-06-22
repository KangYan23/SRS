import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General", trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    dailyReset: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);