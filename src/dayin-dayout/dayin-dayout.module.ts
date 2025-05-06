import { Module } from "@nestjs/common";
import { DayInDayOutController } from "./dayin-dayout.controller";
import { DayInDayOutService } from "./dayin-dayout.service";
import {
  DayInDayOutSchema,
  DayInDayOut,
} from "../../schemas/dayin-dayout.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { TaskSchema, Task } from "../../schemas/task.schema";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DayInDayOut.name, schema: DayInDayOutSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [DayInDayOutController],
  providers: [DayInDayOutService],
})
export class DayinDayoutModule {}
