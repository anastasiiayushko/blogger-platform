import { AnswerStatusesEnum } from '../../../../domain/answer/answer-statuses.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Answer } from '../../../../domain/answer/answer.entity';

export class AnswerViewDto {
  @ApiProperty({ type: String })
  questionId: string;

  @ApiProperty({ enum: AnswerStatusesEnum, enumName: 'AnswerStatusesEnum' })
  answerStatus: AnswerStatusesEnum;

  @ApiProperty({ type: String, format: 'date-time' })
  addedAt: string;

  static mapToView(answer: Answer): AnswerViewDto {
    const dto = new AnswerViewDto();
    dto.questionId = answer.questionId;
    dto.answerStatus = answer.status;
    dto.addedAt = answer.createdAt.toISOString();
    return dto;
  }
}
