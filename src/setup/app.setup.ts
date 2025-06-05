import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  globalPrefixSetup(app);
  // app.useGlobalFilters(
  //   new AllExceptionsFilter(new ConfigService()),
  //   new DomainExceptionsFilter(new ConfigService()),
  // );
  // globalPrefixSetup(app);
  swaggerSetup(app);
}
