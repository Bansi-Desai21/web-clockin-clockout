import { Injectable, BadRequestException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "../../schemas/user.schema";
import { LoginDto, SignupDto } from "../dtos/user.dto";
import * as jwt from "jsonwebtoken";
import {
  EnhancedHttpException,
  createResponse,
} from "../utils/helper.response.function";
import { omit } from "lodash";

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(signupDto: SignupDto, path: string) {
    try {
      const { name, email, password, mobile } = signupDto;

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new BadRequestException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "Email is already taken.",
          path: path,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new this.userModel({
        name,
        email,
        mobile,
        password: hashedPassword,
      });
      await user.save();
      const newUser = omit(user.toObject(), ["password"]);

      return createResponse(
        HttpStatus.CREATED,
        true,
        "Registration successful! Welcome aboard!",
        newUser
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(loginDto: LoginDto, path: string) {
    try {
      const { email, password } = loginDto;

      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new BadRequestException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "User does not exist.",
          path: path,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException({
          statusCode: HttpStatus.FORBIDDEN,
          success: false,
          message: "Email address or password you entered is incorrect.",
          path: path,
        });
      }

      const payload = {
        userId: user._id,
        email: user.email,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });
      const userObject = {
        userId: user._id,
        email: user.email,
        token: token,
      };

      return createResponse(
        HttpStatus.OK,
        true,
        "You’ve successfully logged in! Welcome back!",
        userObject
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async listUsers(path: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const users = await this.userModel
        .find({}, { name: 1, email: 1, mobile: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const totalUsers = await this.userModel.countDocuments({});
      return createResponse(
        HttpStatus.OK,
        true,
        "User list fetched successfully",
        { totalUsers, users }
      );
    } catch (error) {
      throw new EnhancedHttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || "Internal Server Error",
          path: path,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
