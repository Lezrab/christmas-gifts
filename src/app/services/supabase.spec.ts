import { TestBed } from '@angular/core/testing';

import { Supabase } from './supabase';

const fromMock = vi.fn();
const storageFromMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: fromMock,
    storage: { from: storageFromMock },
  }),
}));

interface QueryResult {
  data?: unknown;
  error?: unknown;
}

function queryBuilder(result: QueryResult) {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: (resolve: (value: QueryResult) => void) => resolve(result),
  };
  return builder;
}

describe('Supabase', () => {
  let service: Supabase;

  beforeEach(() => {
    fromMock.mockReset();
    storageFromMock.mockReset();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Supabase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProfiles returns the profile list on success', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: [{ id: '1', name: 'Alice' }], error: null }));

    const profiles = await service.getProfiles();

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(profiles).toEqual([{ id: '1', name: 'Alice' }]);
  });

  it('getProfiles throws when Supabase returns an error', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: new Error('boom') }));

    await expect(service.getProfiles()).rejects.toThrow('boom');
  });

  it('addProfile throws when Supabase returns an error', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: new Error('insert failed') }));

    await expect(service.addProfile('Bob')).rejects.toThrow('insert failed');
  });

  it('getProfileById throws when Supabase returns an error', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: new Error('not found') }));

    await expect(service.getProfileById('42')).rejects.toThrow('not found');
  });

  it('getGiftsByMember returns an empty array when there is no data', async () => {
    fromMock.mockReturnValue(queryBuilder({ data: null, error: null }));

    const gifts = await service.getGiftsByMember('member-1');

    expect(gifts).toEqual([]);
  });

  it('reserveGift updates the reserved_by column', async () => {
    const builder = queryBuilder({ data: [{ id: 'g1', reserved_by: 'Alice' }], error: null });
    fromMock.mockReturnValue(builder);

    const { error } = await service.reserveGift('g1', 'Alice');

    expect(builder.update).toHaveBeenCalledWith({ reserved_by: 'Alice' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'g1');
    expect(error).toBeNull();
  });

  it('uploadAvatar throws when the storage upload fails', async () => {
    storageFromMock.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('storage down') }),
      getPublicUrl: vi.fn(),
    });

    const file = new File(['content'], 'photo.png', { type: 'image/png' });

    await expect(service.uploadAvatar(file)).rejects.toThrow('storage down');
  });

  it('uploadGiftImage returns the public URL on success', async () => {
    storageFromMock.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/img.png' } }),
    });

    const file = new File(['content'], 'gift.png', { type: 'image/png' });

    const url = await service.uploadGiftImage(file);

    expect(url).toBe('https://cdn/img.png');
  });
});
