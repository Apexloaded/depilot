import { Module } from '@nestjs/common';

import { LinksModule } from './links/links.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [LinksModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
