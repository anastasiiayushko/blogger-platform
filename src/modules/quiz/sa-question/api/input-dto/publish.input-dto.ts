import { ApiProperty } from '@nestjs/swagger';

export class PublishInputDto {
  @ApiProperty({
    description:
      'True if question is completed and can be used in the Quiz game',
    type: Boolean,
    required: true,
  })
  declare published: boolean;
}
