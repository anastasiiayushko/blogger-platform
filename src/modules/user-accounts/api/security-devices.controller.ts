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
import { ObjectIdValidationPipe } from '../../../core/pipes/object-id-validation-transform-pipe';
import { CommandBus } from '@nestjs/cqrs';
import { SecurityDeviceQueryRepository } from '../infrastructure/query/security-device.query-repository';
import { TerminateAllOtherDevicesCommand } from '../application/security-devices-usecases/terminate-current-device.usecase';
import { SecurityDeviceViewDto } from './view-dto/security-device.view-dto';
import { DeleteDeviceByIdCommand } from '../application/security-devices-usecases/delete-device-by-id.usecase';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('/security/devices')
@SkipThrottle()
export class SecurityDevicesController {
  constructor(
    protected commandBus: CommandBus,
    protected securityDeviceQRepository: SecurityDeviceQueryRepository,
  ) {}

  @Get('')
  @UseGuards(RefreshTokenAuthGuard)
  async getById(
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
  ): Promise<SecurityDeviceViewDto[]> {
    return await this.securityDeviceQRepository.getAllDevicesByUserId(
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
    @Param('deviceId', ObjectIdValidationPipe) deviceId: string,
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
  ) {
    return this.commandBus.execute<DeleteDeviceByIdCommand>(
      new DeleteDeviceByIdCommand(deviceId, payload.userId),
    );
  }
}
