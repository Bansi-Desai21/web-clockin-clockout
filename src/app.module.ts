import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { DayinDayoutModule } from "./dayin-dayout/dayin-dayout.module";
import { AuthMiddleware } from "./middleware/auth.middleware";
import { TaskModule } from "./task/task.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    DayinDayoutModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/sign-up", method: RequestMethod.POST },
        { path: "auth/login", method: RequestMethod.POST }
      )
      .forRoutes("*");
  }
}
