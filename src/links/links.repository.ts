import { EntityRepository, Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto';
import { Link } from './link.entity';

@EntityRepository(Link)
export class LinksRepository extends Repository<Link> {
  async createLink(createLinkDto: CreateLinkDto): Promise<Link> {
    const { name, url } = createLinkDto;
    const link = this.create({
      name,
      url,
    });

    await this.save(link);

    return link;
  }
}
