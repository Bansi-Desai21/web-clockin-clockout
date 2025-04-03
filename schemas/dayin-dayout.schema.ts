import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Types } from "mongoose";

export type DayInDayOutDocument = DayInDayOut & Document;

@Schema({ timestamps: true })
export class DayInDayOut {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  dayIn: Date;

  @Prop({ required: false })
  dayOut?: Date;

  @Prop({
    type: [
      {
        clockIn: { type: Date, required: true },
        clockOut: { type: Date, required: false },
      },
    ],
    default: [],
  })
  clockEntries: { clockIn: Date; clockOut?: Date }[];

  @Prop({ required: false, default: false })
  isCompleted: boolean;
}

export const DayInDayOutSchema = SchemaFactory.createForClass(DayInDayOut);
