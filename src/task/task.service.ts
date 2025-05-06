import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Task, TaskDocument } from "../../schemas/task.schema";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from "../dtos/task.dto";
import {
  createResponse,
  EnhancedHttpException,
} from "../utils/helper.response.function";

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async createTask(userId: string, createTaskDto: CreateTaskDto, path: string) {
    try {
      const newTask = new this.taskModel({
        userId: new Types.ObjectId(userId),
        ...createTaskDto,
        history: [{ action: "Created", timestamp: new Date() }],
      });

      await newTask.save();

      return createResponse(200, true, "Task created successfully!.", newTask);
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

  async updateTask(
    userId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    path: string
  ) {
    try {
      const task = await this.taskModel.findOne({
        _id: taskId,
        userId: new Types.ObjectId(userId),
      });
      if (!task)
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Task not found.",
          path,
        });

      Object.assign(task, updateTaskDto);
      task.history.push({ action: "Updated", timestamp: new Date() });

      await task.save();

      return createResponse(200, true, "Task updated successfully!.", task);
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

  async deleteTask(userId: string, taskId: string, path: string) {
    try {
      const task = await this.taskModel.findOneAndDelete({
        _id: taskId,
        userId: new Types.ObjectId(userId),
      });
      if (!task)
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Task not found.",
          path,
        });

      return createResponse(200, true, "Task deleted successfully!.");
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

  async getTaskHistory(
    userId: string,
    path: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const start = startDate
        ? new Date(startDate)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date();

      const tasks = await this.taskModel
        .find({
          userId: new Types.ObjectId(userId),
          $or: [
            { startedAt: { $gte: start, $lte: end } },

            { completedAt: { $gte: start, $lte: end } },

            {
              $and: [
                { completedAt: { $exists: false } },
                { createdAt: { $gte: start, $lte: end } },
              ],
            },

            {
              $and: [
                { completedAt: { $exists: false } },
                { createdAt: { $lte: end } },
              ],
            },
          ],
        })
        .populate("userId", "-password")
        .sort({ updatedAt: -1 });

      const formattedTasks = tasks.map((task) => {
        const startTime = task.startedAt ? new Date(task.startedAt) : null;
        const endTime = task.completedAt ? new Date(task.completedAt) : null;
        const duration =
          startTime && endTime
            ? this.calculateDuration(startTime, endTime)
            : "--";

        return {
          id: task._id,
          user: task.userId,
          title: task.title,
          description: task.description,
          timeLog: task.timeLogs,
          duration,
          isRunning: !task.completedAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
        };
      });

      return createResponse(
        200,
        true,
        "Task history retrieved successfully!",
        formattedTasks
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

  private calculateDuration(start: Date, end: Date): string {
    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
    const hours = Math.floor(diff / 60);
    const minutes = Math.floor(diff % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  async updateTaskStatus(
    userId: string,
    taskId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    path: string
  ) {
    try {
      const task = await this.taskModel.findOne({
        _id: taskId,
        userId: new Types.ObjectId(userId),
      });
      if (!task)
        throw new NotFoundException({
          statusCode: 404,
          success: false,
          message: "Task not found.",
          path,
        });

      const { status } = updateTaskStatusDto;
      const now = new Date();

      if (status === "in-progress") {
        task.startedAt = task.startedAt || now;
        task.timeLogs.push({ start: now });
      } else if (status === "completed") {
        task.completedAt = now;
        if (
          task.timeLogs.length > 0 &&
          !task.timeLogs[task.timeLogs.length - 1].end
        ) {
          task.timeLogs[task.timeLogs.length - 1].end = now;
        }
      }

      task.status = status;
      task.history.push({
        action: `Status updated to ${status}`,
        timestamp: now,
      });

      await task.save();

      return createResponse(
        200,
        true,
        "Task status updated successfully!.",
        task
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
