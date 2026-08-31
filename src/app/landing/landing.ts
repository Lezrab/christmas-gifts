import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Supabase } from '../services/supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Member } from '../models/member/member';
import { Toast } from '../services/toast';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  imports: [FormsModule],
})
export class LandingComponent implements OnInit {
  @ViewChild('profileModal') modal!: ElementRef<HTMLDialogElement>;
  @ViewChild('trashModal') trashModal!: ElementRef<HTMLDialogElement>;
  // On utilise un signal pour une UI réactive
  familyMembers = signal<Member[]>([]);
  deletedMembers = signal<Member[]>([]);
  isLoading = signal(true);
  // Objet tampon pour la création/modification
  selectedMember: Partial<Member> = { id: '', name: '', mail: '', avatar_url: '' };
  private toastSvc = inject(Toast);

  // Palette d'avatars par défaut
  private avatarColors = [
    '#c1666b',
    '#5b7c82',
    '#d9a441',
    '#8a7ca8',
    '#4c6b70',
    '#a34e53',
    '#7a8fa6',
    '#b8894a',
  ];

  constructor(
    private supabaseSvc: Supabase,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.fetchMembers();
  }

  async fetchMembers() {
    this.isLoading.set(true);
    try {
      const members = await this.supabaseSvc.getProfiles();
      this.familyMembers.set(members);
    } catch (err) {
      console.error(err);
      this.toastSvc.show('Erreur lors du chargement des profils', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddModal() {
    this.selectedMember = { id: '', name: '', mail: '', avatar_url: '' };
    this.modal.nativeElement.showModal();
  }

  goToMember(id: string) {
    this.router.navigate(['/list', id]);
  }

  async deleteMember(event: Event, id: string) {
    event.stopPropagation();

    const confirmDelete = confirm('Envoyer ce profil à la corbeille ?');
    if (confirmDelete) {
      const error = await this.supabaseSvc.deleteProfile(id);
      if (!error) {
        // Met à jour la liste localement sans recharger toute la page
        this.familyMembers.update((members) => members.filter((m) => m.id !== id));
        this.toastSvc.show('Profil envoyé à la corbeille');
      } else {
        this.toastSvc.show('Erreur lors de la suppression', 'error');
      }
    }
  }

  async openTrash() {
    try {
      const deleted = await this.supabaseSvc.getDeletedProfiles();
      this.deletedMembers.set(deleted);
    } catch (err) {
      console.error(err);
      this.toastSvc.show('Erreur lors du chargement de la corbeille', 'error');
      return;
    }
    this.trashModal.nativeElement.showModal();
  }

  closeTrash() {
    this.trashModal.nativeElement.close();
  }

  async restoreMember(id: string) {
    const error = await this.supabaseSvc.restoreProfile(id);
    if (error) {
      this.toastSvc.show('Erreur lors de la restauration', 'error');
      return;
    }
    this.deletedMembers.update((members) => members.filter((m) => m.id !== id));
    this.toastSvc.show('Profil restauré');
    await this.fetchMembers();
  }

  async permanentlyDeleteMember(id: string) {
    const confirmDelete = confirm('Supprimer définitivement ce profil ? Cette action est irréversible.');
    if (!confirmDelete) return;

    const error = await this.supabaseSvc.permanentlyDeleteProfile(id);
    if (error) {
      this.toastSvc.show('Erreur lors de la suppression définitive', 'error');
      return;
    }
    this.deletedMembers.update((members) => members.filter((m) => m.id !== id));
    this.toastSvc.show('Profil supprimé définitivement');
  }

  async editMember(event: Event, member: Member) {
    event.stopPropagation();
    // On crée une copie pour ne pas modifier l'original en direct
    this.selectedMember = { ...member };
    this.modal.nativeElement.showModal();
  }

  closeModal() {
    this.modal.nativeElement.close();
  }

  async saveProfile() {
    const name = this.selectedMember.name?.trim();
    if (!name) {
      this.toastSvc.show('Le prénom est obligatoire', 'error');
      return;
    }

    try {
      if (this.selectedMember.id) {
        const { error } = await this.supabaseSvc.updateProfile(this.selectedMember.id, {
          name,
          mail: this.selectedMember.mail,
          avatar_url: this.selectedMember.avatar_url,
        });
        if (error) throw error;
        this.toastSvc.show('Profil mis à jour');
      } else {
        await this.supabaseSvc.addProfile(name, this.selectedMember.avatar_url);
        this.toastSvc.show('Profil ajouté');
      }
      await this.fetchMembers();
      this.closeModal();
    } catch (err) {
      console.error(err);
      this.toastSvc.show('Erreur de sauvegarde', 'error');
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      try {
        const publicUrl = await this.supabaseSvc.uploadAvatar(file);
        this.selectedMember.avatar_url = publicUrl; // Met à jour l'aperçu
      } catch (err) {
        this.toastSvc.show("Erreur lors de l'upload", 'error');
      }
    }
  }

  onBackdropClick(event: MouseEvent) {
    // On récupère l'élément dialog
    const dialogElement = event.target as HTMLDialogElement;

    // Si l'élément cliqué est le dialog lui-même (et non ses enfants comme la div modal-content)
    // cela signifie qu'on a cliqué sur le "backdrop" (le fond sombre)
    if (dialogElement.tagName === 'DIALOG') {
      dialogElement.close();
    }
  }

  // Couleur stable par membre : dérivée de son id, pas recalculée à chaque
  // cycle de détection de changement (sinon elle "clignote" à l'écran).
  getAvatarColor(member: Member): string {
    let hash = 0;
    for (let i = 0; i < member.id.length; i++) {
      hash = member.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarColors.length;
    return this.avatarColors[index];
  }
}
