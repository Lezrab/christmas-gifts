import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingComponent } from './landing';
import { Supabase } from '../services/supabase';
import { Member } from '../models/member/member';

// jsdom n'implémente pas showModal() sur <dialog>
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}

describe('Landing', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let supabaseMock: {
    getProfiles: ReturnType<typeof vi.fn>;
    addProfile: ReturnType<typeof vi.fn>;
    deleteProfile: ReturnType<typeof vi.fn>;
    getDeletedProfiles: ReturnType<typeof vi.fn>;
    restoreProfile: ReturnType<typeof vi.fn>;
    permanentlyDeleteProfile: ReturnType<typeof vi.fn>;
  };

  const members: Member[] = [
    { id: '1', name: 'Alice', mail: '', avatar_url: '' },
    { id: '2', name: 'Bob', mail: '', avatar_url: '' },
  ];

  beforeEach(async () => {
    supabaseMock = {
      getProfiles: vi.fn().mockResolvedValue(members),
      addProfile: vi.fn().mockResolvedValue([]),
      deleteProfile: vi.fn().mockResolvedValue(null),
      getDeletedProfiles: vi.fn().mockResolvedValue([]),
      restoreProfile: vi.fn().mockResolvedValue(null),
      permanentlyDeleteProfile: vi.fn().mockResolvedValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([]), { provide: Supabase, useValue: supabaseMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the family members on init and stops loading', () => {
    expect(supabaseMock.getProfiles).toHaveBeenCalled();
    expect(component.familyMembers()).toEqual(members);
    expect(component.isLoading()).toBe(false);
  });

  it('adds a new profile from the prompt and refreshes the list', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Charlie');

    await component.openAddModal();

    expect(supabaseMock.addProfile).toHaveBeenCalledWith('Charlie');
    expect(supabaseMock.getProfiles).toHaveBeenCalledTimes(2);
  });

  it('does not add a profile when the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    await component.openAddModal();

    expect(supabaseMock.addProfile).not.toHaveBeenCalled();
  });

  it('removes a member locally after a successful deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const event = new Event('click');

    await component.deleteMember(event, '1');

    expect(supabaseMock.deleteProfile).toHaveBeenCalledWith('1');
    expect(component.familyMembers().map((m) => m.id)).toEqual(['2']);
  });

  it('returns the same avatar color for the same member on repeated calls', () => {
    const colorA = component.getAvatarColor(members[0]);
    const colorB = component.getAvatarColor(members[0]);

    expect(colorA).toBe(colorB);
  });

  it('shows an error and stops loading when fetching profiles fails', async () => {
    supabaseMock.getProfiles.mockRejectedValueOnce(new Error('network down'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component.fetchMembers();

    expect(component.isLoading()).toBe(false);
    expect(window.alert).toHaveBeenCalled();
  });

  it('loads the deleted members when opening the trash', async () => {
    supabaseMock.getDeletedProfiles.mockResolvedValueOnce([members[0]]);

    await component.openTrash();

    expect(component.deletedMembers()).toEqual([members[0]]);
  });

  it('restores a member from the trash and refreshes the active list', async () => {
    component.deletedMembers.set([members[0]]);

    await component.restoreMember('1');

    expect(supabaseMock.restoreProfile).toHaveBeenCalledWith('1');
    expect(component.deletedMembers()).toEqual([]);
  });

  it('permanently deletes a member after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deletedMembers.set([members[0]]);

    await component.permanentlyDeleteMember('1');

    expect(supabaseMock.permanentlyDeleteProfile).toHaveBeenCalledWith('1');
    expect(component.deletedMembers()).toEqual([]);
  });
});
