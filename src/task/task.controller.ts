import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Req,
  Patch,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TaskService } from "./task.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from "../dtos/task.dto";

@ApiTags("Tasks")
@Controller("tasks")
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post("create-task")
  @ApiOperation({ summary: "Create a new task" })
  @ApiResponse({ status: 201, description: "Task created successfully." })
  @ApiResponse({ status: 400, description: "Bad request." })
  async createTask(@Req() req, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.createTask(req.user.id, createTaskDto, req.url);
  }

  @Put("update-task/:taskId")
  @ApiOperation({ summary: "Update a task" })
  @ApiResponse({ status: 200, description: "Task updated successfully." })
  @ApiResponse({ status: 404, description: "Task not found." })
  async updateTask(
    @Req() req,
    @Param("taskId") taskId: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.taskService.updateTask(
      req.user.id,
      taskId,
      updateTaskDto,
      req.url
    );
  }

  @Delete("delete-task/:taskId")
  @ApiOperation({ summary: "Delete a task" })
  @ApiResponse({ status: 200, description: "Task deleted successfully." })
  @ApiResponse({ status: 404, description: "Task not found." })
  async deleteTask(@Req() req, @Param("taskId") taskId: string) {
    return this.taskService.deleteTask(req.user.id, taskId, req.url);
  }

  @Get("task-history")
  @ApiOperation({ summary: "Get task history" })
  @ApiResponse({
    status: 200,
    description: "Task history retrieved successfully.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async getTaskHistory(@Req() req) {
    return this.taskService.getTaskHistory(req.user.id, req.url);
  }

  @Patch("update-task-status/:taskId")
  @ApiOperation({ summary: "Update task status" })
  @ApiResponse({
    status: 200,
    description: "Task status updated successfully.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async updateTaskStatus(
    @Req() req,
    @Param("taskId") taskId: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto
  ) {
    return this.taskService.updateTaskStatus(
      req.user.id,
      taskId,
      updateTaskStatusDto,
      req.url
    );
  }
}
