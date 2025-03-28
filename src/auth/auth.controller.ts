import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, SignupDto } from "../dtos/user.dto";
import { User } from "../../schemas/user.schema";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-up")
  @ApiOperation({ summary: "User Signup" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "User successfully registered",
    type: User,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Bad request" })
  async signup(@Body() signupDto: SignupDto, @Req() req) {
    return this.authService.signup(signupDto, req.url);
  }

  @Post("login")
  @ApiOperation({ summary: "Login a user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "You are Loggedin successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid email or password",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
  })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    return await this.authService.login(loginDto, req.url);
  }

  @Get("users")
  @ApiOperation({ summary: "Get list of users with type 'owner'" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Restaurant fetched successfully",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
  })
  async listUsers(
    @Req() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return this.authService.listUsers(req.url, page, limit);
  }
}
