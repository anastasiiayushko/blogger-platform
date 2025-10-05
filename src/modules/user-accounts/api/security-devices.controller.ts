import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  RefreshTokenPayloadDto,
  RefreshTokenPayloadFromRequest,
} from '../decorators/param/refresh-token-payload-from-request.decorators';
import { RefreshTokenAuthGuard } from '../guards/refresh-token/refresh-token-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { TerminateAllOtherDevicesCommand } from '../application/security-devices-usecases/terminate-current-device.usecase';
import { DeleteDeviceByIdCommand } from '../application/security-devices-usecases/delete-device-by-id.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { UuidValidationPipe } from '../../../core/pipes/uuid-validation-transform-pipe';
import { SessionDeviceQueryRepository } from '../infrastructure/query/session-device.query-repository';
import { DeviceViewModel } from '../infrastructure/view-model/device-view-model';

@Controller('/security/devices')
@SkipThrottle()
export class SecurityDevicesController {
  constructor(
    protected commandBus: CommandBus,
    protected sessionDeviceQueryRepository: SessionDeviceQueryRepository,
  ) {}

  @Get('')
  @UseGuards(RefreshTokenAuthGuard)
  async getById(
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
  ): Promise<DeviceViewModel[]> {
    return this.sessionDeviceQueryRepository.getAllDevicesByUserId(
      payload.userId,
    );
  }

  @Delete('')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  async terminateAllOtherDevices(
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
  ): Promise<void> {
    await this.commandBus.execute<TerminateAllOtherDevicesCommand>(
      new TerminateAllOtherDevicesCommand(payload.deviceId, payload.userId),
    );
    return;
  }

  @Delete('/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  async terminateDevice(
    @Param('deviceId', UuidValidationPipe) deviceId: string,
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
  ): Promise<void> {
    await this.commandBus.execute<DeleteDeviceByIdCommand>(
      new DeleteDeviceByIdCommand(deviceId, payload.userId),
    );
    return;
  }
}
