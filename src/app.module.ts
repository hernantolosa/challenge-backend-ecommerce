import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { Environment } from './config/environment';
import { EnvironmentModule } from './config/environment.module';
import { databaseOptions } from './database/database.options';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [
    EnvironmentModule,
    TypeOrmModule.forRootAsync({ inject: [Environment], useFactory: databaseOptions }),
    CatalogModule,
    StockModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
