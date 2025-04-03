import { Module } from "@nestjs/common";
import { DayInDayOutController } from "./dayin-dayout.controller";
import { DayInDayOutService } from "./dayin-dayout.service";
import { DayInDayOutSchema, DayInDayOut } from "schemas/dayin-dayout.schema";
import { MongooseModule } from "@nestjs/mongoose";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DayInDayOut.name, schema: DayInDayOutSchema },
    ]),
  ],
  controllers: [DayInDayOutController],
  providers: [DayInDayOutService],
})
export class DayinDayoutModule {}
