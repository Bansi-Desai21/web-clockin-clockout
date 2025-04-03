import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  PAUSED = "paused",
  COMPLETED = "completed",
}

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    enum: TaskStatus,
    default: "pending",
  })
  status: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [{ start: Date, end: Date }] })
  timeLogs: { start: Date; end?: Date }[];

  @Prop({ type: [{ action: String, timestamp: Date }] })
  history: { action: string; timestamp: Date }[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
