import { IsOptional } from 'class-validator';

export class GetPostFilterContextInputDTO {
  @IsOptional()
  blogId: string;
}
