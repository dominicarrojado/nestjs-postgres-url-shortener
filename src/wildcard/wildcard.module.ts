import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { WildcardController } from './wildcard.controller';

@Module({
  imports: [LinksModule],
  controllers: [WildcardController],
})
export class WildcardModule {}
