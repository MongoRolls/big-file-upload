import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppService } from './app.service';

describe('Upload storage compatibility', () => {
  let directory: string;
  let cwd: jest.SpyInstance;
  const service = new AppService();

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'upload-regression-'));
    cwd = jest.spyOn(process, 'cwd').mockReturnValue(directory);
  });
  afterEach(async () => {
    cwd.mockRestore();
    await rm(directory, { recursive: true, force: true });
  });

  it('writes the parsed chunk and preserves resumable-upload verification', async () => {
    const chunk = {
      buffer: Buffer.from('fixture bytes'),
    } as Express.Multer.File;
    const result = await service.uploadChunk(chunk, {
      fileHash: 'fixture',
      chunkIndex: 1,
      extname: 'txt',
    });
    expect(result.code).toBe(200);
    const state = await service.verifyFile('fixture', 2, 'txt');
    expect(state.code).toBe(200);
    expect(state.data.neededFileList).toEqual([2]);
    // Verify the persisted bytes, without writing into the repository uploads directory.
    const fs = await import('node:fs/promises');
    const suffixes = await fs.readdir(join(directory, 'uploads'));
    expect(
      await readFile(
        join(directory, 'uploads', suffixes[0], 'fixture', 'chunk-1'),
        'utf8',
      ),
    ).toBe('fixture bytes');
  });
});
