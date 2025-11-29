import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDefined } from 'class-validator';

export class PublishInputDto {
  @ApiProperty({
    description:
      'True if question is completed and can be used in the Quiz game',
    type: Boolean,
    required: true,
  })
  @IsDefined() // Ensures the property is not undefined or null
  @IsBoolean() // Ensures the property is a boolean
  published: boolean;
}
