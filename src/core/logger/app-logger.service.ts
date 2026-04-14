import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class AppLoggerService extends ConsoleLogger implements LoggerService {
  private readonly logsDirPath = join(process.cwd(), 'logs');
  private readonly errorLogFilePath = join(this.logsDirPath, 'error.log');

  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message as string, ...(optionalParams as [string?]));

    this.ensureLogsDirectory();
    const context = this.extractContext(optionalParams);
    const stack = this.extractStack(optionalParams);
    const normalizedMessage =
      message instanceof Error ? message.message : String(message);

    const logRecord = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message: normalizedMessage,
      stack,
    });

    appendFileSync(this.errorLogFilePath, `${logRecord}\n`, 'utf8');
  }

  private ensureLogsDirectory(): void {
    if (!existsSync(this.logsDirPath)) {
      mkdirSync(this.logsDirPath, { recursive: true });
    }
  }

  private extractContext(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }

    const lastParam = optionalParams[optionalParams.length - 1];
    return typeof lastParam === 'string' ? lastParam : undefined;
  }

  private extractStack(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }

    const firstParam = optionalParams[0];
    return typeof firstParam === 'string' ? firstParam : undefined;
  }
}
