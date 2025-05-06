import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  DayInDayOut,
  DayInDayOutDocument,
} from "../../schemas/dayin-dayout.schema";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";
import { Types } from "mongoose";
import { TaskDocument, Task } from "../../schemas/task.schema";
@Injectable()
export class DayInDayOutService {
  constructor(
    @InjectModel(DayInDayOut.name)
    private readonly dayInDayOutModel: Model<DayInDayOutDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>
  ) {}

  async pauseInProgressTasks(
    userId: string,
    reason: string = "Automatically paused due to clock out/day out"
  ) {
    await this.taskModel.updateMany(
      { userId: new Types.ObjectId(userId), status: "in-progress" },
      {
        $set: { status: "completed", updatedAt: new Date() },
        $push: {
          history: {
            action: reason,
            timestamp: new Date(),
          },
        },
        $currentDate: {
          "timeLogs.$[elem].end": true,
        },
      },
      {
        arrayFilters: [{ "elem.end": { $exists: false } }],
      }
    );
  }

  async recordAttendance(
    userId: string,
    action: "dayIn" | "dayOut" | "clockIn" | "clockOut",
    path: string
  ) {
    try {
      const existingEntry = await this.dayInDayOutModel.findOne({
        userId: new Types.ObjectId(userId),
        isCompleted: false,
      });

      switch (action) {
        case "dayIn":
          if (existingEntry) {
            const lastDay = new Date(existingEntry.dayIn)
              .toISOString()
              .split("T")[0];
            const today = new Date().toISOString().split("T")[0];

            if (lastDay !== today) {
              existingEntry.dayOut = new Date(
                new Date(lastDay).setHours(19, 0, 0, 0)
              );
              existingEntry.isCompleted = true;
              await existingEntry.save();
            } else {
              throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                success: false,
                message: "You have already checked in for today.",
                path: path,
              });
            }
          }

          const newEntry = new this.dayInDayOutModel({
            userId: new Types.ObjectId(userId),
            dayIn: new Date(),
            clockEntries: [{ clockIn: new Date() }],
          });

          await newEntry.save();
          return createResponse(
            HttpStatus.CREATED,
            true,
            "Day In recorded successfully!",
            newEntry
          );

        case "clockIn":
          if (!existingEntry) {
            throw new NotFoundException({
              statusCode: HttpStatus.NOT_FOUND,
              success: false,
              message: "No active Day In record found.",
              path: path,
            });
          }

          const lastClockIn =
            existingEntry.clockEntries[existingEntry.clockEntries.length - 1];
          if (lastClockIn && !lastClockIn.clockOut) {
            throw new BadRequestException({
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message: "You must clock out before clocking in again.",
              path: path,
            });
          }

          existingEntry.clockEntries.push({ clockIn: new Date() });
          await existingEntry.save();
          return createResponse(
            HttpStatus.OK,
            true,
            "Clock In recorded successfully!",
            existingEntry
          );

        case "clockOut":
          if (!existingEntry) {
            throw new NotFoundException({
              statusCode: HttpStatus.NOT_FOUND,
              success: false,
              message: "No active Day In record found.",
              path: path,
            });
          }

          const lastClockOut =
            existingEntry.clockEntries[existingEntry.clockEntries.length - 1];
          if (!lastClockOut || lastClockOut.clockOut) {
            throw new BadRequestException({
              statusCode: HttpStatus.BAD_REQUEST,
              success: false,
              message: "You must clock in before clocking out.",
              path: path,
            });
          }

          await this.pauseInProgressTasks(
            userId,
            "Automatically paused due to clock out"
          );
          lastClockOut.clockOut = new Date();

          await existingEntry.save();

          return createResponse(
            HttpStatus.OK,
            true,
            "Clock Out recorded successfully!",
            existingEntry
          );

        case "dayOut":
          if (!existingEntry) {
            throw new NotFoundException({
              statusCode: HttpStatus.NOT_FOUND,
              success: false,
              message: "No active Day In record found.",
              path: path,
            });
          }

          await this.pauseInProgressTasks(
            userId,
            "Automatically paused due to day out"
          );

          existingEntry.dayOut = new Date();
          existingEntry.isCompleted = true;
          await existingEntry.save();
          return createResponse(
            HttpStatus.OK,
            true,
            "Day Out recorded successfully!",
            existingEntry
          );

        default:
          throw new BadRequestException("Invalid action.");
      }
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserRecords({
    userId,
    page,
    limit,
    startDate,
    endDate,
    path,
  }: {
    userId: string;
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    path: string;
  }) {
    try {
      const filter: any = { userId: new Types.ObjectId(userId) };

      if (startDate && endDate) {
        filter.dayIn = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        filter.dayIn = { $gte: new Date(startDate) };
      } else if (endDate) {
        filter.dayIn = { $lte: new Date(endDate) };
      }
      const skip = (page - 1) * limit;

      const records = await this.dayInDayOutModel
        .find(filter)
        .populate("userId", "-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalRecords = await this.dayInDayOutModel.countDocuments(filter);

      return createResponse(
        HttpStatus.OK,
        true,
        "User records retrieved successfully!",
        {
          records,
          totalRecords,
        }
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
