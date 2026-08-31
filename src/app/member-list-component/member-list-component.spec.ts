import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { MemberListComponent } from './member-list-component';
import { Supabase } from '../services/supabase';
import { Gift } from '../models/gift/gift';

describe('MemberListComponent', () => {
  let component: MemberListComponent;
  let fixture: ComponentFixture<MemberListComponent>;
  let supabaseMock: Record<string, ReturnType<typeof vi.fn>>;

  const gifts: Gift[] = [
    {
      id: 'g1',
      created_at: '2026-01-01T00:00:00.000Z',
      member_id: 'member-1',
      title: 'Zebre en peluche',
      image_url: '',
      is_important: false,
      image_from_link_preview: false,
    },
    {
      id: 'g2',
      created_at: '2026-01-01T00:00:00.000Z',
      member_id: 'member-1',
      title: 'Appareil photo',
      image_url: '',
      is_important: true,
      image_from_link_preview: false,
    },
  ];

  beforeEach(async () => {
    supabaseMock = {
      getProfileById: vi.fn().mockResolvedValue({ id: 'member-1', name: 'Alice' }),
      getGiftsByMember: vi.fn().mockResolvedValue([...gifts]),
      addGift: vi.fn().mockResolvedValue(undefined),
      updateGift: vi.fn().mockResolvedValue({ data: [], error: null }),
      deleteGift: vi.fn().mockResolvedValue(null),
      reserveGift: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    await TestBed.configureTestingModule({
      imports: [MemberListComponent],
      providers: [
        provideRouter([]),
        { provide: Supabase, useValue: supabaseMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'member-1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the member name and sorts gifts with favorites first', () => {
    expect(component.memberName()).toBe('Alice');
    expect(component.gifts().map((g) => g.title)).toEqual(['Appareil photo', 'Zebre en peluche']);
  });

  it('filters gifts by selected years', () => {
    component.toggleYearFilter(2026);
    expect(component.filteredGifts().length).toBe(2);

    component.toggleYearFilter(2026); // désélection -> plus aucun filtre
    expect(component.filteredGifts().length).toBe(2);

    component.toggleYearFilter(2099);
    expect(component.filteredGifts().length).toBe(0);
  });

  it('adds a new gift when the buffer has no id', async () => {
    component.newGift = { title: 'Chaussettes', url: '' };

    await component.saveGift();

    expect(supabaseMock['addGift']).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Chaussettes', member_id: 'member-1' }),
    );
    expect(supabaseMock['updateGift']).not.toHaveBeenCalled();
  });

  it('updates an existing gift when the buffer has an id', async () => {
    component.newGift = { id: 'g1', title: 'Zebre en peluche XL', url: '' };

    await component.saveGift();

    expect(supabaseMock['updateGift']).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ title: 'Zebre en peluche XL' }),
    );
    expect(supabaseMock['addGift']).not.toHaveBeenCalled();
  });

  it('marks a gift as reserved and updates it locally', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Bob');
    const event = new Event('click');

    await component.reserveGift(event, gifts[0]);

    expect(supabaseMock['reserveGift']).toHaveBeenCalledWith('g1', 'Bob');
    expect(component.gifts().find((g) => g.id === 'g1')?.reserved_by).toBe('Bob');
  });

  it('does not reserve a gift when the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const event = new Event('click');

    await component.reserveGift(event, gifts[0]);

    expect(supabaseMock['reserveGift']).not.toHaveBeenCalled();
  });

  it('releases a reserved gift', async () => {
    const reserved = { ...gifts[0], reserved_by: 'Bob' };
    component.gifts.set([reserved, gifts[1]]);
    const event = new Event('click');

    await component.releaseGift(event, reserved);

    expect(supabaseMock['reserveGift']).toHaveBeenCalledWith('g1', null);
    expect(component.gifts().find((g) => g.id === 'g1')?.reserved_by).toBeNull();
  });

  it('validates URLs before accepting them', () => {
    expect(component.isValidUrl('https://example.com')).toBe(true);
    expect(component.isValidUrl('not-a-url')).toBe(false);
    expect(component.isValidUrl('')).toBe(false);
    expect(component.isValidUrl(undefined)).toBe(false);
  });
});
