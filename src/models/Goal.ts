import mongoose, { Schema, type InferSchemaType } from "mongoose";

const goalSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
  },
  { timestamps: true },
);

export type GoalDoc = InferSchemaType<typeof goalSchema>;

export const Goal: mongoose.Model<GoalDoc> =
  mongoose.models.Goal || mongoose.model<GoalDoc>("Goal", goalSchema);
