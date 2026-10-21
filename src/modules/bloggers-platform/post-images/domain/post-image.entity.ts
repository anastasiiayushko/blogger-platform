import { Column, Entity, ManyToOne } from 'typeorm';
import { CreatePostImageDto } from './dto/create-post-image.dto';
import { randomUUID } from 'crypto';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Post } from '../../posts/domain/post.entity';
import { PostImageStatus } from '../application/port/post-images-repository.port';

@Entity({ name: 'post_images' })
export class PostImage extends BaseOrmEntity {
  // сформироанный путь файла.
  // уникальный адресс объекта внутри bucket. posts/{postId}/images/{imageId}.webp
  @Column()
  objectKey: string;

  // пользовательское Имя файла, в нашем кейсе пока упускаем.
  //
  // @Column()
  // originName: string;

  //Тип содержимого файла: image/jpeg, image/png
  // Необходимо для правильной передачи Content-Type
  //Не стоит ограничивать колонку database enum значениями PNG/JPEG, если планируется расширение.
  // Добавление формата тогда потребует изменения enum и миграции. Обычная строка гибче, а допустимые значения можно контролировать
  // на уровне приложения:
  @Column({ length: 100 })
  mimeType: string;

  //ограничения максимального размера
  //проверки согласованности с объектом в S3.
  @Column({ type: 'integer' })
  size: number;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  etag: string | null;

  //контрольная сумма, — вычисленный из содержимого файла хеш, предназначенный для проверки целостности данных
  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  @Column()
  postId: string;

  @ManyToOne(() => Post, (p) => p.images)
  post: Post;

  static create(input: CreatePostImageDto): PostImage {
    const image = new PostImage();
    image.postId = input.postId;
    image.objectKey = input.objectKey;
    image.size = input.size;
    image.mimeType = input.mimeType;
    image.status = PostImageStatus.pending;
    image.checksum = null;
    image.etag = null;

    return image;
  }

  static generateObjectKey(postId: string, fileType: string): string {
    return `posts/${postId}/images/${randomUUID()}.${fileType}`;
  }

  markReady() {
    if (this.status !== PostImageStatus.pending) {
      throw new Error('PostImage is already in progress');
    }
    this.status = PostImageStatus.ready;
  }

  markFailed() {
    if (this.status !== PostImageStatus.pending) {
      throw new Error('PostImage is already in progress');
    }
    this.status = PostImageStatus.failed;
  }
}
