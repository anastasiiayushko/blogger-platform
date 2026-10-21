# S3-загрузка изображений для постов: roadmap реализации

## Цель

Реализовать безопасную загрузку изображений к постам в S3-совместимое
хранилище, сохраняя метаданные файлов в PostgreSQL.

План построен от простого варианта к более масштабируемому:

1. загрузка файла через NestJS backend;
2. сохранение метаданных в PostgreSQL;
3. получение и удаление изображений;
4. обработка ошибок между PostgreSQL и S3;
5. прямая загрузка в S3 через presigned URL;
6. фоновая обработка и очистка потерянных объектов.

---

## 1. Базовая модель

При работе с изображением участвуют две системы:

```text
PostgreSQL                       S3
──────────                       ──
postId                           бинарное содержимое файла
objectKey
originalName
mimeType
size
width/height
status
createdAt
```

S3 хранит файл. PostgreSQL хранит информацию о файле и его связь с
бизнес-сущностями.

Не следует:

- сохранять бинарный файл в таблице `post`;
- использовать исходное имя файла как S3 key;
- хранить временный presigned URL в базе;
- делать bucket публичным ради получения изображений;
- передавать AWS credentials клиентскому приложению.

В базе должен храниться стабильный `objectKey`, например:

```text
posts/{postId}/images/{imageId}.webp
```

URL для закрытого объекта генерируется при необходимости.

---

## 2. Что изучить до начала реализации

### 2.1. HTTP-загрузка файлов

Нужно понимать:

- формат `multipart/form-data`;
- отличие обычного JSON body от multipart-запроса;
- как Multer обрабатывает файл;
- разницу между memory storage и disk storage;
- что находится в `Express.Multer.File`;
- ограничения размера HTTP body;
- потоковую обработку и потребление памяти.

Для первой реализации можно использовать memory storage и файлы до 5 MB.
Это позволит передавать `file.buffer` в AWS SDK.

Материал:

- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)

### 2.2. Основные понятия S3

Нужно разобраться в терминах:

- bucket;
- object;
- object key;
- prefix;
- metadata;
- content type;
- ETag;
- checksum;
- region;
- endpoint;
- object version;
- bucket policy;
- IAM policy;
- presigned URL.

Важно: папок в S3 в обычном файловом смысле нет. Строка
`posts/123/images/image.webp` является одним object key. Символ `/` только
создаёт визуальную и логическую структуру префиксов.

### 2.3. AWS SDK for JavaScript v3

Основные классы и команды:

- `S3Client`;
- `PutObjectCommand`;
- `GetObjectCommand`;
- `HeadObjectCommand`;
- `DeleteObjectCommand`;
- `getSignedUrl`;
- `Upload` из `@aws-sdk/lib-storage` для multipart upload.

Материалы:

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [S3 examples for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)
- [S3 considerations in SDK v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-s3.html)

---

## 3. Архитектура модуля

Рекомендуемая структура:

```text
src/modules/bloggers-platform/post-images/
├── api/
│   ├── post-images.controller.ts
│   ├── input-dto/
│   └── view-dto/
├── application/
│   ├── usecases/
│   │   ├── upload-post-image.usecase.ts
│   │   ├── delete-post-image.usecase.ts
│   │   └── complete-post-image-upload.usecase.ts
│   └── query-usecases/
│       └── get-post-images.query-usecase.ts
├── domain/
│   ├── post-image.entity.ts
│   ├── file-storage.port.ts
│   └── dto/
├── infrastructure/
│   ├── post-image.repository.ts
│   ├── post-image.query-repository.ts
│   └── s3/
│       └── s3-file-storage.adapter.ts
└── post-images.module.ts
```

Ответственность слоёв:

```text
Controller
  принимает HTTP-запрос и файл
        ↓
Command handler / use case
  проверяет бизнес-правила и управляет сценарием
        ↓
FileStoragePort
  описывает необходимые операции с файлами
        ↓
S3FileStorageAdapter
  работает с AWS SDK
```

Контроллер не должен:

- создавать `S3Client`;
- формировать AWS-команды;
- сохранять TypeORM entity напрямую;
- содержать логику компенсации при ошибке;
- решать, как формируется object key.

---

## 4. Абстракция файлового хранилища

Application layer не должен зависеть от AWS SDK.

Пример порта:

```ts
export interface UploadFileInput {
  objectKey: string;
  body: Buffer;
  contentType: string;
  contentLength: number;
}

export interface StoredFile {
  objectKey: string;
  etag?: string;
  checksum?: string;
}

export abstract class FileStoragePort {
  abstract upload(input: UploadFileInput): Promise<StoredFile>;

  abstract delete(objectKey: string): Promise<void>;

  abstract exists(objectKey: string): Promise<boolean>;

  abstract createDownloadUrl(
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string>;
}
```

Преимущества:

- use case тестируется без S3;
- AWS SDK изолирован в infrastructure layer;
- S3 можно заменить на MinIO, Cloudflare R2 или другое совместимое хранилище;
- конфигурация endpoint и path-style не проникает в бизнес-логику.

Для dependency injection лучше использовать abstract class или отдельный
Nest injection token.

---

## 5. Модель `PostImage`

Рекомендуемые поля:

```text
id              UUID, primary key
post_id         UUID, foreign key → post.id
object_key      text, unique
original_name   text
mime_type       text
size            bigint
width           integer, nullable
height          integer, nullable
etag            text, nullable
checksum        text, nullable
status          enum/text
created_at
updated_at
deleted_at
version
```

Возможные статусы:

```text
PENDING   — загрузка начата, но ещё не подтверждена
READY     — объект загружен и доступен
DELETING  — ожидается удаление объекта
FAILED    — операция не завершилась
```

Для первой backend-загрузки можно начать без статусов. Для presigned upload
статус `PENDING` понадобится, потому что выдача URL ещё не означает, что клиент
действительно загрузил файл.

Отношение:

```text
Post 1 ───── N PostImage
```

Если у поста может быть только одна обложка, это бизнес-ограничение можно
выразить отдельным полем `type` или уникальным индексом. Не стоит ограничивать
всю модель отношением один-к-одному, если позже может появиться галерея.

### Вопросы, которые нужно решить заранее

- Сколько изображений разрешено одному посту?
- Есть ли отдельная обложка?
- Разрешена ли замена изображения?
- Кто может загружать и удалять изображения?
- Что происходит с изображениями при удалении поста?
- Нужен ли порядок изображений?
- Нужны ли оригинал и несколько преобразованных размеров?

---

## 6. Конфигурация

Добавить типизированный config-класс, например `FileStorageConfig`.

Переменные окружения:

```dotenv
S3_REGION=
S3_BUCKET=
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
S3_UPLOAD_MAX_SIZE_BYTES=5242880
S3_DOWNLOAD_URL_EXPIRES_SECONDS=300
```

Правила:

- не коммитить реальные credentials;
- добавить названия переменных в `.env.example`;
- валидировать обязательные значения через `class-validator`;
- не обращаться к `ConfigService` из use case;
- создать `S3Client` один раз через Nest provider;
- endpoint и `forcePathStyle` делать настраиваемыми для S3-compatible сервисов.

В AWS production-окружении предпочтительнее IAM Role и временные credentials,
а не постоянные access keys.

Материал:

- [IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## 7. Этап 1: загрузка через backend

### HTTP-контракт

```http
POST /api/posts/:postId/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<binary>
```

Пример контроллера:

```ts
@Post(':postId/images')
@UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  }),
)
async uploadImage(
  @Param('postId', new ParseUUIDPipe()) postId: string,
  @UploadedFile(
    new ParseFilePipeBuilder()
      .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
      .addFileTypeValidator({
        fileType: /(jpeg|png|webp)$/,
      })
      .build(),
  )
  file: Express.Multer.File,
) {
  // Controller делегирует выполнение command bus.
}
```

Это только пример направления. Настройки валидации лучше вынести из контроллера.

### Последовательность use case

```text
1. Проверить существование Post.
2. Проверить право пользователя изменять Post.
3. Проверить лимит изображений.
4. Сгенерировать imageId.
5. Определить реальный тип содержимого.
6. Сформировать objectKey.
7. Загрузить объект в S3.
8. Создать PostImage.
9. Сохранить PostImage в PostgreSQL.
10. Вернуть view model.
```

Object key:

```ts
const objectKey =
  `posts/${postId}/images/${imageId}.${safeExtension}`;
```

Нельзя включать в key:

- access token;
- email;
- пароль или secret;
- полный локальный путь;
- исходное имя без обработки;
- другие чувствительные данные.

### Критерии готовности

- JPEG/PNG/WebP загружаются;
- файл больше лимита отклоняется;
- неподдерживаемый формат отклоняется;
- несуществующий `postId` возвращает `404`;
- неавторизованный пользователь получает `401/403`;
- после успеха существуют и объект в S3, и запись в PostgreSQL;
- application-тесты используют mock `FileStoragePort`.

---

## 8. Валидация и безопасность

### Проверки

Минимально необходимо проверять:

- наличие файла;
- максимальный размер;
- разрешённые форматы;
- magic bytes содержимого;
- размеры изображения;
- право пользователя на загрузку;
- количество изображений поста;
- безопасно сгенерированный object key.

`Content-Type` присылает клиент, поэтому ему нельзя полностью доверять.
Расширение файла также не доказывает его формат.

Стоит изучить библиотеку определения типа файла по сигнатуре содержимого.
После определения реального формата расширение object key должно соответствовать
этому формату, а не исходному имени.

### Защита S3

- включить Block Public Access;
- отключить ACL, если они не требуются;
- предоставить приложению только необходимые действия;
- ограничить доступ конкретным bucket и prefix;
- не давать приложению `s3:*`;
- не отдавать пользователю AWS credentials;
- включить server-side encryption;
- настроить CORS только при переходе к прямой загрузке из браузера.

Пример минимальной области доступа приложения:

```text
s3:PutObject
s3:GetObject
s3:DeleteObject
s3:HeadObject
```

Конкретный набор зависит от выбранного сценария. Resource следует ограничивать:

```text
arn:aws:s3:::your-bucket/posts/*
```

Материалы:

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [S3 security best practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

---

## 9. Согласованность PostgreSQL и S3

PostgreSQL и S3 не поддерживают общую ACID-транзакцию.

Проблема:

```text
PutObject успешно
        ↓
INSERT post_image завершился ошибкой
        ↓
объект остался в S3 без записи в PostgreSQL
```

Для первой версии применяется компенсация:

```ts
const storedFile = await fileStorage.upload(uploadInput);

try {
  await postImageRepository.save(postImage);
} catch (error) {
  await fileStorage.delete(storedFile.objectKey);
  throw error;
}
```

Удаление тоже может завершиться частично:

```text
DELETE из PostgreSQL успешно
        ↓
DeleteObject завершился ошибкой
        ↓
файл остался в S3
```

Более надёжный вариант:

```text
1. Пометить PostImage как DELETING.
2. Зафиксировать транзакцию PostgreSQL.
3. Удалить объект из S3.
4. Выполнить soft delete записи.
5. При ошибке повторить операцию фоновым процессом.
```

Темы для углубления:

- compensating transaction;
- eventual consistency приложения;
- transactional outbox;
- idempotency;
- retry с exponential backoff;
- dead-letter queue;
- orphan object cleanup.

---

## 10. Этап 2: получение изображения

Для закрытого bucket возможны два варианта.

### Вариант A: backend proxy

```text
Client → NestJS → S3 → NestJS → Client
```

Преимущества:

- полный контроль доступа;
- простой клиент.

Недостатки:

- трафик проходит через backend;
- выше нагрузка;
- нужно корректно работать со stream.

При использовании `GetObjectCommand` AWS SDK v3 возвращает stream. Его нужно
потребить или корректно передать в HTTP response.

### Вариант B: presigned GET URL

```text
Client → NestJS: запрос изображения
NestJS → Client: временный URL
Client → S3: скачивание
```

Для изображений это обычно более масштабируемый вариант.

URL должен иметь короткое время жизни, например 5 минут. В PostgreSQL хранится
`objectKey`, а не сгенерированный URL.

### Критерии готовности

- получить изображение может только пользователь с необходимыми правами;
- URL имеет ограниченный срок действия;
- удалённое изображение больше не выдаётся;
- ошибка отсутствующего S3-объекта корректно обрабатывается;
- в логах не выводятся credentials и полный presigned URL.

---

## 11. Этап 3: удаление и замена

Endpoint:

```http
DELETE /api/posts/:postId/images/:imageId
```

Проверки:

- Post существует;
- PostImage существует;
- изображение действительно относится к указанному Post;
- пользователь имеет право удалить изображение;
- повторное удаление обрабатывается идемпотентно.

При замене не следует загружать новый файл под существующим key. Безопаснее:

```text
1. Создать новый imageId и objectKey.
2. Загрузить новое изображение.
3. Обновить связь или статус в PostgreSQL.
4. Удалить старый объект.
```

Так снижается риск потерять рабочее изображение, если загрузка нового завершится
ошибкой.

---

## 12. Этап 4: presigned upload

Переходить к этому этапу рекомендуется после реализации backend upload.

### Последовательность

```text
1. Client → Backend:
   POST /posts/:postId/images/upload-url

2. Backend:
   - авторизует пользователя;
   - проверяет Post;
   - генерирует imageId и objectKey;
   - создаёт PostImage со статусом PENDING;
   - создаёт presigned PUT URL.

3. Backend → Client:
   - imageId;
   - uploadUrl;
   - обязательные headers;
   - expiresAt.

4. Client → S3:
   PUT binary по uploadUrl.

5. Client → Backend:
   POST /posts/:postId/images/:imageId/complete

6. Backend:
   - выполняет HeadObject;
   - проверяет размер и Content-Type;
   - при необходимости проверяет checksum;
   - переводит PostImage в READY.
```

Важно:

- выдача URL не означает успешную загрузку;
- backend должен генерировать object key;
- URL должен иметь короткий срок жизни;
- желательно подписывать ожидаемый `Content-Type`;
- одинаковый key может быть перезаписан;
- `complete` должен быть идемпотентным;
- незавершённые `PENDING` записи и объекты нужно очищать.

Материал:

- [Uploading objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

### CORS

Для прямой загрузки из браузера bucket должен разрешать CORS только для
необходимых origin, методов и headers.

Не следует использовать:

```text
AllowedOrigins: *
AllowedMethods: *
```

для production без осознанной причины.

---

## 13. Проверка целостности

Нужно различать:

- MIME type — описание типа;
- magic bytes — сигнатура формата;
- checksum — проверка неизменности содержимого;
- ETag — идентификатор версии объекта, но не универсальная MD5-сумма.

Не следует всегда воспринимать ETag как MD5. Для multipart upload и некоторых
вариантов шифрования его значение имеет другую семантику.

AWS SDK умеет вычислять checksum при загрузке. При необходимости checksum можно
сохранить в `post_image`.

Материал:

- [Checking object integrity in S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html)

---

## 14. Обработка изображений

После базовой загрузки можно добавить:

- проверку width/height;
- удаление EXIF metadata;
- коррекцию orientation;
- преобразование в WebP/AVIF;
- создание thumbnail;
- ограничение максимального разрешения;
- защиту от decompression bomb;
- хранение оригинала и производных вариантов.

Вариант модели вариантов изображения:

```text
post-image/{imageId}/original
post-image/{imageId}/large.webp
post-image/{imageId}/medium.webp
post-image/{imageId}/thumbnail.webp
```

Не стоит добавлять обработку изображений в первую итерацию. Сначала нужно
надёжно реализовать upload, metadata, delete и обработку ошибок.

Темы для углубления:

- Sharp;
- EXIF;
- image dimensions validation;
- asynchronous image processing;
- queues;
- CPU и memory limits;
- CDN и cache headers.

---

## 15. Multipart upload

Multipart upload нужен для больших файлов и нестабильных соединений. Он разбивает
объект на части, позволяет загружать их параллельно и повторять только неудачные
части.

Для фотографий с лимитом 5 MB multipart upload не нужен.

AWS рекомендует рассматривать multipart upload для объектов около 100 MB и
больше.

При использовании multipart upload нужно уметь:

- инициировать загрузку;
- хранить `uploadId`;
- загружать части;
- сохранять номера частей и ETag;
- завершать загрузку;
- отменять незавершённые загрузки;
- очищать старые multipart uploads через lifecycle rule.

Материал:

- [S3 multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

---

## 16. Тестирование

### Unit/application tests

В use case мокается `FileStoragePort`.

Сценарии:

- успешная загрузка;
- Post не найден;
- нет прав;
- превышен лимит изображений;
- ошибка S3;
- ошибка PostgreSQL после успешного S3 upload;
- компенсационное удаление вызвано;
- ошибка компенсационного удаления логируется;
- повторная команда не создаёт дубликаты.

Не нужно мокать сам `S3Client` в application-тестах — application layer не должен
о нём знать.

### Integration tests

Проверить:

- TypeORM mapping `PostImage`;
- foreign key на `post`;
- unique constraint для `object_key`;
- soft delete;
- работу `S3FileStorageAdapter` с тестовым хранилищем;
- корректность endpoint/region/path-style конфигурации.

Для локальных integration/e2e-тестов можно использовать S3-compatible MinIO
или LocalStack. При этом хотя бы один smoke test желательно выполнить с реальным
провайдером, потому что совместимость реализаций не всегда абсолютна.

### E2E-сценарий

```text
1. Создать Post.
2. Загрузить изображение.
3. Получить PostImage metadata.
4. Проверить существование объекта.
5. Получить download URL.
6. Скачать объект.
7. Удалить изображение.
8. Проверить отсутствие объекта и доступной записи.
```

---

## 17. Наблюдаемость

Логировать:

- operation name;
- `postId`;
- `imageId`;
- `objectKey`;
- размер;
- MIME type;
- длительность операции;
- AWS request ID;
- тип ошибки.

Не логировать:

- access key;
- secret key;
- session token;
- Authorization header;
- полный presigned URL;
- содержимое файла.

Метрики:

- количество upload/delete;
- длительность S3-запросов;
- количество ошибок;
- объём загружаемых данных;
- количество `PENDING` объектов;
- количество компенсационных удалений.

---

## 18. Рекомендуемый порядок разработки

### Итерация 1 — инфраструктурный фундамент

- [ ] Создать `FileStorageConfig`.
- [ ] Добавить env-переменные и их валидацию.
- [ ] Создать `FileStoragePort`.
- [ ] Создать `S3FileStorageAdapter`.
- [ ] Зарегистрировать `S3Client` как Nest provider.
- [ ] Написать smoke test загрузки и удаления тестового объекта.

### Итерация 2 — модель данных

- [ ] Создать `PostImage` entity.
- [ ] Добавить отношение `Post 1:N PostImage`.
- [ ] Создать и проверить миграцию.
- [ ] Создать command repository.
- [ ] Создать query repository и view DTO.

### Итерация 3 — backend upload

- [ ] Добавить multipart endpoint.
- [ ] Ограничить размер.
- [ ] Проверять MIME type и содержимое.
- [ ] Проверять Post и права пользователя.
- [ ] Генерировать безопасный object key.
- [ ] Загрузить объект в S3.
- [ ] Сохранить метаданные.
- [ ] Добавить компенсацию при ошибке БД.
- [ ] Написать application и e2e tests.

### Итерация 4 — чтение и удаление

- [ ] Добавить получение списка изображений Post.
- [ ] Добавить presigned GET URL.
- [ ] Добавить удаление изображения.
- [ ] Сделать удаление идемпотентным.
- [ ] Определить поведение при удалении Post.

### Итерация 5 — presigned upload

- [ ] Добавить статус `PENDING`.
- [ ] Создать endpoint выдачи upload URL.
- [ ] Настроить bucket CORS.
- [ ] Создать endpoint подтверждения.
- [ ] Проверять объект через `HeadObject`.
- [ ] Добавить очистку просроченных `PENDING`.

### Итерация 6 — production hardening

- [ ] Настроить IAM least privilege.
- [ ] Включить Block Public Access.
- [ ] Настроить server-side encryption.
- [ ] Добавить retry/backoff.
- [ ] Добавить outbox или cleanup job.
- [ ] Настроить lifecycle rules.
- [ ] Добавить метрики и алерты.
- [ ] Проверить лимиты и стоимость.

---

## 19. Минимальная первая версия

Чтобы не перегружать первую реализацию, ограничить scope:

```text
Типы: JPEG, PNG, WebP
Размер: максимум 5 MB
Количество: одно изображение за запрос
Хранилище: private bucket
Загрузка: через NestJS backend
Получение: presigned GET URL
Удаление: backend вызывает DeleteObject
Метаданные: отдельная таблица post_image
Тесты: mock FileStoragePort + integration test адаптера
```

Не включать в первую версию:

- multipart upload;
- CDN;
- очередь;
- несколько thumbnail;
- антивирус;
- presigned upload;
- сложную обработку изображений.

---

## 20. Вопросы для самопроверки

После первой реализации нужно уметь ответить:

1. Чем bucket отличается от object?
2. Почему в S3 нет настоящих директорий?
3. Почему нельзя доверять `Content-Type`?
4. Чем object key отличается от URL?
5. Почему presigned URL нельзя хранить как постоянный адрес?
6. Где должны храниться AWS credentials?
7. Почему S3 и PostgreSQL нельзя обновить одной транзакцией?
8. Что произойдёт, если S3 upload успешен, а INSERT завершится ошибкой?
9. Как найти и удалить orphan objects?
10. Почему ETag не всегда является MD5?
11. Зачем нужен `HeadObject` после presigned upload?
12. Как сделать upload и delete идемпотентными?
13. Чем backend upload отличается от presigned upload?
14. Когда нужен multipart upload?
15. Почему object key должен генерировать backend?

Если ответы на эти вопросы понятны, можно переходить к presigned upload,
фоновой обработке изображений и production-настройкам.

