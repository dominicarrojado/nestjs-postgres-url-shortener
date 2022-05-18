import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
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

    try {
      await this.save(link);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Short name already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }

    return link;
  }
}
