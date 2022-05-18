import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import faker from '@faker-js/faker';
import { clearRepositories, createNestApplication } from '../test-helpers';
import { LinksRepository } from './links.repository';
import { Link } from './link.entity';

describe('Links', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let linksRepository: LinksRepository;
  const createLinkBody = () => {
    return {
      name: faker.word.noun(),
      url: faker.internet.url(),
    };
  };
  const createInvalidLinkBodies = () => {
    const validLink = createLinkBody();

    return [
      // invalid payload
      undefined,
      {},

      // invalid name
      { name: undefined, url: validLink.url },
      { name: null, url: validLink.url },
      { name: faker.datatype.boolean(), url: validLink.url },
      { name: faker.datatype.number(), url: validLink.url },
      { name: JSON.parse(faker.datatype.json()), url: validLink.url },
      { name: '', url: validLink.url },

      // invalid url
      { name: validLink.name, url: undefined },
      { name: validLink.name, url: null },
      { name: validLink.name, url: faker.datatype.boolean() },
      { name: validLink.name, url: faker.datatype.number() },
      { name: validLink.name, url: JSON.parse(faker.datatype.json()) },
      { name: validLink.name, url: '' },
      { name: validLink.name, url: faker.word.noun() },
    ];
  };
  const createLinkItem = async () => {
    const linkBody = createLinkBody();

    return linksRepository.createLink(linkBody);
  };
  const createInvalidLinkIds = () => {
    return [faker.datatype.number(), faker.word.noun()];
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

  describe('/links (GET)', () => {
    it('should handle without data', async () => {
      const res = await request(app.getHttpServer()).get('/links');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle with data', async () => {
      const promises: Array<Promise<Link>> = [];
      const linksCount = 3;

      for (let i = 0; i < linksCount; i++) {
        promises.push(createLinkItem());
      }

      const links = await Promise.all(promises);
      const res = await request(app.getHttpServer()).get('/links');
      const resBody = res.body;

      expect(res.status).toBe(200);
      expect(resBody).toEqual(expect.arrayContaining(links));
      expect(resBody).toHaveLength(linksCount);
    });
  });

  describe('/links (POST)', () => {
    it('should NOT accept invalid data', async () => {
      const invalidData = createInvalidLinkBodies();
      const promises: Array<Promise<void>> = [];

      invalidData.forEach((payload) => {
        promises.push(
          (async () => {
            const res = await request(app.getHttpServer())
              .post('/links')
              .send(payload);
            const resBody = res.body;

            expect(res.status).toBe(400);
            expect(resBody.error).toBe('Bad Request');
            expect(resBody.message).toEqual(
              expect.arrayContaining([expect.any(String)]),
            );
          })(),
        );
      });

      await Promise.all(promises);
    });

    it('should accept valid data', async () => {
      const linkBody = createLinkBody();

      const res = await request(app.getHttpServer())
        .post('/links')
        .send(linkBody);
      const resBody = res.body;

      expect(res.status).toBe(201);
      expect(resBody).toEqual({
        ...linkBody,
        id: expect.any(String),
      });

      const linkId = resBody.id;
      const link = await linksRepository.findOne({ id: linkId });

      expect(link).toEqual(resBody);
    });

    it('should handle already exists', async () => {
      const existingLink = await createLinkItem();
      const linkBody = createLinkBody();

      const res = await request(app.getHttpServer()).post('/links').send({
        name: existingLink.name,
        url: linkBody.url,
      });
      const resBody = res.body;

      expect(res.status).toBe(409);
      expect(resBody.error).toBe('Conflict');
      expect(resBody.message).toBe('Short name already exists');
    });

    it('should handle unexpected error', async () => {
      const linksRepositorySaveMock = jest
        .spyOn(linksRepository, 'save')
        .mockRejectedValue({});

      const linkBody = createLinkBody();

      const res = await request(app.getHttpServer())
        .post('/links')
        .send(linkBody);
      const resBody = res.body;

      expect(res.status).toBe(500);
      expect(resBody.message).toBe('Internal Server Error');

      linksRepositorySaveMock.mockRestore();
    });
  });

  describe('/links/:id (DELETE)', () => {
    it('should NOT accept invalid id', async () => {
      const invalidData = createInvalidLinkIds();
      const promises: Array<Promise<void>> = [];

      invalidData.forEach((linkId) => {
        promises.push(
          (async () => {
            const res = await request(app.getHttpServer()).delete(
              `/links/${linkId}`,
            );
            const resBody = res.body;

            expect(res.status).toBe(400);
            expect(resBody.error).toBe('Bad Request');
            expect(resBody.message).toEqual(
              expect.arrayContaining([expect.any(String)]),
            );
          })(),
        );
      });

      await Promise.all(promises);
    });

    it('should handle not found', async () => {
      const linkId = faker.datatype.uuid();
      const res = await request(app.getHttpServer()).delete(`/links/${linkId}`);
      const resBody = res.body;

      expect(res.status).toBe(404);
      expect(resBody.error).toBe('Not Found');
      expect(resBody.message).toBe(`Link with ID: "${linkId}" not found`);
    });

    it('should handle delete', async () => {
      const link = await createLinkItem();
      const linkId = link.id;

      const res = await request(app.getHttpServer()).delete(`/links/${linkId}`);

      expect(res.status).toBe(200);

      const deletedLink = await linksRepository.findOne({ id: linkId });

      expect(deletedLink).toBeUndefined();
    });
  });

  describe('/links/:id (PUT)', () => {
    it('should NOT accept invalid id', async () => {
      const invalidData = createInvalidLinkIds();
      const promises: Array<Promise<void>> = [];

      invalidData.forEach((linkId) => {
        promises.push(
          (async () => {
            const res = await request(app.getHttpServer()).put(
              `/links/${linkId}`,
            );
            const resBody = res.body;

            expect(res.status).toBe(400);
            expect(resBody.error).toBe('Bad Request');
            expect(resBody.message).toEqual(
              expect.arrayContaining([expect.any(String)]),
            );
          })(),
        );
      });

      await Promise.all(promises);
    });

    it('should NOT accept invalid data', async () => {
      const linkId = faker.datatype.uuid();
      const invalidData = createInvalidLinkBodies();
      const promises: Array<Promise<void>> = [];

      invalidData.forEach((payload) => {
        promises.push(
          (async () => {
            const res = await request(app.getHttpServer())
              .put(`/links/${linkId}`)
              .send(payload);
            const resBody = res.body;

            expect(res.status).toBe(400);
            expect(resBody.error).toBe('Bad Request');
            expect(resBody.message).toEqual(
              expect.arrayContaining([expect.any(String)]),
            );
          })(),
        );
      });

      await Promise.all(promises);
    });

    it('should handle not found', async () => {
      const linkId = faker.datatype.uuid();
      const linkBody = createLinkBody();
      const res = await request(app.getHttpServer())
        .put(`/links/${linkId}`)
        .send(linkBody);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Not Found');
    });

    it('should handle update', async () => {
      const link = await createLinkItem();
      const linkId = link.id;
      const newLinkBody = createLinkBody();

      const res = await request(app.getHttpServer())
        .put(`/links/${linkId}`)
        .send(newLinkBody);
      const resBody = res.body;

      expect(res.status).toBe(200);
      expect(resBody).toEqual({
        ...newLinkBody,
        id: linkId,
      });

      const updatedLink = await linksRepository.findOne({ id: linkId });

      expect(updatedLink).toEqual(resBody);
    });
  });
});
