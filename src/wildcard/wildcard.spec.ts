import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import faker from '@faker-js/faker';
import { clearRepositories, createNestApplication } from '../test-helpers';
import { LinksRepository } from '../links/links.repository';

describe('Wildcard', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let linksRepository: LinksRepository;
  const createLinkItem = async () => {
    return linksRepository.createLink({
      name: faker.word.noun(),
      url: faker.internet.url(),
    });
  };

  beforeAll(async () => {
    app = await createNestApplication({
      onBeforeInit: (moduleRef) => {
        dbConnection = moduleRef.get(Connection);
        linksRepository = moduleRef.get(LinksRepository);
      },
    });
  });

  beforeEach(async () => {
    await clearRepositories(dbConnection);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/:name (GET)', () => {
    it('should handle not found', async () => {
      const shortName = faker.word.noun();
      const res = await request(app.getHttpServer()).get(`/${shortName}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Not Found');
    });

    it('should handle redirect', async () => {
      const link = await createLinkItem();
      const res = await request(app.getHttpServer()).get(`/${link.name}`);

      expect(res.status).toBe(301);
      expect(res.headers.location).toBe(link.url);
    });
  });
});
