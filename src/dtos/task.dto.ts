import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsDateString } from "class-validator";
import { TaskStatus } from "../../schemas/task.schema";
export class CreateTaskDto {
  @ApiProperty({ example: "New Task", description: "Title of the task" })
  @IsString()
  title: string;

  @ApiProperty({
    example: "Task description",
    description: "Detailed description of the task",
  })
  @IsString()
  description: string;
}

export class UpdateTaskDto {
  @ApiProperty({
    example: "Updated Task Title",
    required: false,
    description: "Updated title of the task",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: "Updated task description",
    required: false,
    description: "Updated description of the task",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
    enumName: "TaskStatus",
    description: "Updated status of the task",
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
