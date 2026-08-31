import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Supabase } from '../services/supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Member } from '../models/member/member';

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
  // Objet tampon pour la modification
  selectedMember: Partial<Member> = { id: '', name: '', mail: '', avatar_url: '' };

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
      alert('Erreur lors du chargement des profils');
    } finally {
      this.isLoading.set(false);
    }
  }

  async openAddModal() {
    const newName = prompt('Nom du nouveau membre ?');
    if (newName) {
      try {
        await this.supabaseSvc.addProfile(newName);
        await this.fetchMembers(); // Rafraîchit la liste
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'ajout du profil");
      }
    }
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
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  }

  async openTrash() {
    try {
      const deleted = await this.supabaseSvc.getDeletedProfiles();
      this.deletedMembers.set(deleted);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement de la corbeille');
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
      alert('Erreur lors de la restauration');
      return;
    }
    this.deletedMembers.update((members) => members.filter((m) => m.id !== id));
    await this.fetchMembers();
  }

  async permanentlyDeleteMember(id: string) {
    const confirmDelete = confirm('Supprimer définitivement ce profil ? Cette action est irréversible.');
    if (!confirmDelete) return;

    const error = await this.supabaseSvc.permanentlyDeleteProfile(id);
    if (error) {
      alert('Erreur lors de la suppression définitive');
      return;
    }
    this.deletedMembers.update((members) => members.filter((m) => m.id !== id));
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
    if (!this.selectedMember.id) return;

    const { error } = await this.supabaseSvc.updateProfile(this.selectedMember.id, {
      name: this.selectedMember.name,
      mail: this.selectedMember.mail,
      avatar_url: this.selectedMember.avatar_url,
    });

    if (!error) {
      await this.fetchMembers();
      this.closeModal();
    } else {
      alert('Erreur de sauvegarde');
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
        alert("Erreur lors de l'upload");
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
