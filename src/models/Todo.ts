import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const TODO_STATUSES = ["todo", "doing", "done"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

const todoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    status: { type: String, enum: TODO_STATUSES, default: "todo" },
    sortOrder: { type: Number, default: 0 },
    weeklyPlanId: { type: Schema.Types.ObjectId, ref: "WeeklyPlan", default: null },
  },
  { timestamps: true },
);
todoSchema.index({ date: 1 });
todoSchema.index({ weeklyPlanId: 1, status: 1 });
todoSchema.index({ sortOrder: -1 });

export type TodoDoc = InferSchemaType<typeof todoSchema>;

export const Todo: mongoose.Model<TodoDoc> =
  mongoose.models.Todo || mongoose.model<TodoDoc>("Todo", todoSchema);
