import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WallpostsCallbackModule } from './wallposts-callback/wallposts-callback.module';
import { CacheStorageModule } from './cache-storage/cache-storage.module';
import { VkModule } from './vk/vk.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WallpostsCallbackModule, CacheStorageModule, VkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
