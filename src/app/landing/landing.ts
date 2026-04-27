import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Supabase } from '../services/supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  imports: [FormsModule],
})
export class LandingComponent implements OnInit {
  @ViewChild('profileModal') modal!: ElementRef<HTMLDialogElement>;
  // On utilise un signal pour une UI réactive
  familyMembers = signal<any[]>([]);
  // Objet tampon pour la modification
  selectedMember: any = { id: '', name: '', avatar_url: '' };

  constructor(
    private supabaseSvc: Supabase,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.fetchMembers();
  }

  async fetchMembers() {
    const members = await this.supabaseSvc.getProfiles();
    this.familyMembers.set(members);
  }

  async openAddModal() {
    const newName = prompt('Nom du nouveau membre ?');
    if (newName) {
      await this.supabaseSvc.addProfile(newName);
      await this.fetchMembers(); // Rafraîchit la liste
    }
  }

  goToMember(id: string) {
    this.router.navigate(['/list', id]);
  }

  async deleteMember(event: Event, id: string) {
    event.stopPropagation();

    const confirmDelete = confirm('Es-tu sûr de vouloir supprimer ce profil ?');
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

  async editMember(event: Event, member: any) {
    event.stopPropagation();
    // On crée une copie pour ne pas modifier l'original en direct
    this.selectedMember = { ...member };
    this.modal.nativeElement.showModal();
  }

  closeModal() {
    this.modal.nativeElement.close();
  }

  async saveProfile() {
    const { error } = await this.supabaseSvc.updateProfile(this.selectedMember.id, {
      name: this.selectedMember.name,
      avatar_url: this.selectedMember.avatar_url,
    });

    if (!error) {
      await this.fetchMembers();
      this.closeModal();
    } else {
      alert('Erreur de sauvegarde');
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const publicUrl = await this.supabaseSvc.uploadAvatar(file);
        this.selectedMember.avatar_url = publicUrl; // Met à jour l'aperçu
      } catch (err) {
        alert("Erreur lors de l'upload");
      }
    }
  }
}
