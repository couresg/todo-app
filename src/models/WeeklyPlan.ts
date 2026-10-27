import mongoose, { Schema, type InferSchemaType } from "mongoose";

const weeklyPlanSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    weekStart: { type: String, required: true },
    weekEnd: { type: String, required: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", default: null },
  },
  { timestamps: true },
);
weeklyPlanSchema.index({ goalId: 1 });
weeklyPlanSchema.index({ weekStart: 1 });

export type WeeklyPlanDoc = InferSchemaType<typeof weeklyPlanSchema>;

export const WeeklyPlan: mongoose.Model<WeeklyPlanDoc> =
  mongoose.models.WeeklyPlan || mongoose.model<WeeklyPlanDoc>("WeeklyPlan", weeklyPlanSchema);
