import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Week 9 public and protected flows (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets a donor browse public campaigns and transparency data', async () => {
    const campaigns = await request(app.getHttpServer()).get('/campaign').expect(200);
    expect(campaigns.body).toMatchObject({
      items: expect.any(Array),
      meta: expect.objectContaining({ page: 1 }),
    });

    const overview = await request(app.getHttpServer())
      .get('/transparency/overview')
      .expect(200);
    expect(overview.body).toMatchObject({
      publicCampaigns: expect.any(Number),
      successfulDonations: expect.any(Number),
    });
  });

  it('protects organizer and admin routes without an access token', async () => {
    await request(app.getHttpServer()).get('/campaign/organizer/dashboard').expect(401);
    await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
  });
});
