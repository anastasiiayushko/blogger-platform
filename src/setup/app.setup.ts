import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';
import { AllExceptionsFilter } from '../core/exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from '../core/exceptions/filters/domain-exceptions.filter';
import { ConfigService } from '@nestjs/config';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  app.useGlobalFilters(
    new AllExceptionsFilter(new ConfigService()),
    new DomainExceptionsFilter(new ConfigService()),
  );
  // globalPrefixSetup(app);
  swaggerSetup(app);
}
