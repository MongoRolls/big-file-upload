import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('Upload HTTP dependency regressions', () => {
  let app: INestApplication;
  const service = {
    verifyFile: jest.fn().mockResolvedValue({ code: 200 }),
    uploadChunk: jest.fn().mockResolvedValue({ code: 200 }),
    mergeFile: jest.fn().mockResolvedValue({ code: 200 }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('parses JSON for the existing verify endpoint', async () => {
    await request(app.getHttpServer())
      .post('/api/file/verify')
      .send({ fileHash: 'fixture', totalCount: 2, extname: 'txt' })
      .expect(201, { code: 200 });
    expect(service.verifyFile).toHaveBeenCalledWith('fixture', 2, 'txt');
  });

  it('preserves multipart fields and chunk bytes', async () => {
    await request(app.getHttpServer())
      .post('/api/file/upload')
      .field('fileHash', 'fixture')
      .field('chunkIndex', '1')
      .field('extname', 'txt')
      .attach('chunk', Buffer.from('upload fixture'), 'chunk.txt')
      .expect(201);
    const [file, fields] = service.uploadChunk.mock.calls[0];
    expect(file.buffer.equals(Buffer.from('upload fixture'))).toBe(true);
    expect(fields).toMatchObject({
      fileHash: 'fixture',
      chunkIndex: '1',
      extname: 'txt',
    });
  });

  it('rejects unexpected multipart file fields', async () => {
    await request(app.getHttpServer())
      .post('/api/file/upload')
      .attach('unexpected', Buffer.from('fixture'), 'chunk.txt')
      .expect(400);
    expect(service.uploadChunk).not.toHaveBeenCalled();
  });

  it('keeps the 10 MiB chunk limit enforced', async () => {
    await request(app.getHttpServer())
      .post('/api/file/upload')
      .attach('chunk', Buffer.alloc(10 * 1024 * 1024 + 1), 'chunk.txt')
      .expect(413);
    expect(service.uploadChunk).not.toHaveBeenCalled();
  });

  it('rejects truncated multipart then continues serving', async () => {
    await request(app.getHttpServer())
      .post('/api/file/upload')
      .set('Content-Type', 'multipart/form-data; boundary=fixture')
      .send(
        '--fixture\r\nContent-Disposition: form-data; name="chunk"; filename="x"\r\n\r\nx',
      )
      .timeout(2000)
      .expect(400);
    expect(service.uploadChunk).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post('/api/file/upload')
      .attach('chunk', Buffer.from('healthy'), 'chunk.txt')
      .expect(201);
  });
});
