import {
  SecurityDevice,
  SecurityDeviceModelType,
} from '../../domin/security-device.entity';
import { Types } from 'mongoose';
import { SecurityDeviceViewDto } from '../../api/view-dto/security-device.view-dto';
import { InjectModel } from '@nestjs/mongoose';

export class SecurityDeviceQueryRepository {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly SecurityDeviceModel: SecurityDeviceModelType,
  ) {}

  async getAllDevicesByUserId(
    userId: string,
  ): Promise<SecurityDeviceViewDto[]> {
    const items = await this.SecurityDeviceModel.find({
      userId: new Types.ObjectId(userId),
    });
    return items.map((item) => SecurityDeviceViewDto.mapView(item));
  }
}
