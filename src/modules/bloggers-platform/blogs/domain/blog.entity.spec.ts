import { Blog } from './blog.entity';
import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';

describe('Blog Domain Entity', () => {
  it('success create instance blog', () => {
    const dto = {
      name: 'supper blog',
      description: 'description',
      websiteUrl: 'websiteUrl',
    };
    const entity = Blog.createInstance(dto);

    expect(entity).toBeInstanceOf(Blog);
  });

  it('fail create instance blog', () => {
    const dto = {};
    //@ts-ignore
    expect(Blog.createInstance(dto)).toThrow();
  });
});
