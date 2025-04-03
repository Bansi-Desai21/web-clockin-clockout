import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Body,
  BadRequestException,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";

import { DayInDayOutService } from "./dayin-dayout.service";

@ApiTags("Attendance")
@Controller("attendance")
@ApiBearerAuth()
export class DayInDayOutController {
  constructor(private readonly dayInDayOutService: DayInDayOutService) {}

  @Post("record")
  @ApiOperation({
    summary: "Record attendance action (Day In, Day Out, Clock In, Clock Out)",
  })
  @ApiResponse({ status: 201, description: "Action recorded successfully." })
  @ApiResponse({ status: 400, description: "Invalid action or missing data." })
  @ApiResponse({ status: 404, description: "No active Day In record found." })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["dayIn", "dayOut", "clockIn", "clockOut"],
          description: "The action type (dayIn, dayOut, clockIn, clockOut).",
        },
      },
      required: ["action"],
    },
  })
  async recordAttendance(@Req() req, @Body() body: { action: string }) {
    const { action } = body;
    if (!["dayIn", "dayOut", "clockIn", "clockOut"].includes(action)) {
      throw new BadRequestException("Invalid action type.");
    }

    return this.dayInDayOutService.recordAttendance(
      req.user.id,
      action as "dayIn" | "dayOut" | "clockIn" | "clockOut",
      req.url
    );
  }

  @Get("log-history")
  @ApiOperation({
    summary: "Get log history for a user with pagination & date filter",
  })
  @ApiResponse({ status: 200, description: "Records retrieved successfully." })
  @ApiResponse({ status: 404, description: "No records found." })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    example: 1,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    example: 10,
    description: "Records per page (default: 10)",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: Date,
    example: "2025-03-01",
    description: "Filter by start date (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: Date,
    example: "2025-03-31",
    description: "Filter by end date (YYYY-MM-DD)",
  })
  async getUserRecords(
    @Req() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.dayInDayOutService.getUserRecords({
      userId: req.user.id,
      page,
      limit,
      startDate,
      endDate,
      path: req.url,
    });
  }
}
