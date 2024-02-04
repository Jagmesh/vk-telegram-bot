import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WallpostsCallbackModule } from './wallposts-callback/wallposts-callback.module';
import { CacheStorageModule } from './cache-storage/cache-storage.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WallpostsCallbackModule, CacheStorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
