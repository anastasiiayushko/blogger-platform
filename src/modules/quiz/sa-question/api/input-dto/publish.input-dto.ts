import { ApiProperty, OmitType } from '@nestjs/swagger';
import { TogglePublishQuestionCommand } from '../../application/usecases/toggle-publish-question.usecase';

export class PublishInputDto  {
  @ApiProperty({
    description:
      'True if question is completed and can be used in the Quiz game',
    type: Boolean,
    required: true,
  })
  published: boolean;
}

// export class PublishInputDto extends OmitType(TogglePublishQuestionCommand, [
//   'published',
// ]) {
//   @ApiProperty({
//     description:
//       'True if question is completed and can be used in the Quiz game',
//     type: Boolean,
//     required: true,
//   })
//   published: boolean;
// }
