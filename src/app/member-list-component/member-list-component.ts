import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../services/supabase';
import { Gift } from '../models/gift/gift';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-member-list',
  standalone: true,
  templateUrl: './member-list-component.html',
  styleUrl: './member-list-component.css',
  imports: [FormsModule], // Ajoute FormsModule si tu veux éditer les cadeaux ici
})
export class MemberListComponent implements OnInit {
  memberId = '';
  memberName = signal('');
  gifts = signal<Gift[]>([]);
  @ViewChild('giftModal') modal!: ElementRef<HTMLDialogElement>;

  // Objet tampon pour le nouveau cadeau
  newGift: Partial<Gift> = {
    title: '',
    comment: '',
    price: undefined,
    url: '',
    image_url: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseSvc: Supabase,
  ) {}

  async ngOnInit() {
    // Récupère l'ID passé dans l'URL (/list/ID)
    this.memberId = this.route.snapshot.paramMap.get('id') ?? '';

    if (this.memberId) {
      await this.loadMemberData();
    }
  }

  async loadMemberData() {
    // On récupère le profil pour avoir le nom
    const profile = await this.supabaseSvc.getProfileById(this.memberId);
    this.memberName.set(profile?.name || 'Inconnu');

    // On récupère les cadeaux liés à ce membre
    const data = await this.supabaseSvc.getGiftsByMember(this.memberId);
    this.gifts.set(data);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openGiftModal() {
    this.newGift = {
      member_id: this.memberId,
      title: '',
      comment: '',
      url: '',
    };
    this.modal.nativeElement.showModal();
  }

  closeGiftModal() {
    this.modal.nativeElement.close();
  }

  async saveGift() {
    if (!this.newGift.title) return;

    try {
      const url = this.newGift.url;
      if (!url || !url.startsWith('http')) return;
      try {
        const apiKey = environment.linkPreviewKey;
        const response = await fetch(`https://api.linkpreview.net/?key=${apiKey}&q=${url}`);
        const data = await response.json();

        if (data) {
          if (!this.newGift.title) this.newGift.title = data.title;
          this.newGift.image_url = data.image;
        }
      } catch (err) {
        console.log(err)
      }

      await this.supabaseSvc.addGift(this.newGift);
      await this.loadMemberData(); // Rafraîchit la liste
      this.closeGiftModal();
    } catch (err) {
      console.log(err)
      alert("Erreur lors de l'ajout du cadeau");
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'DIALOG') {
      this.closeGiftModal();
    }
  }

  async deleteGift(event: Event, id: any) {
    event.stopPropagation(); // Empêche de déclencher d'autres clics
    if (confirm('Supprimer cette idée cadeau ?')) {
      await this.supabaseSvc.deleteGift(id); // À ajouter dans ton service
      this.gifts.update((current) => current.filter((g) => g.id !== id));
    }
  }

  editGift(event: Event, gift: any) {
    event.stopPropagation();
    this.newGift = { ...gift }; // On remplit l'objet tampon
    this.modal.nativeElement.showModal();
  }

  async onUrlPaste() {
    const url = this.newGift.url;
    if (!url || !url.startsWith('http')) return;

    const apiKey = environment.linkPreviewKey;

    try {
      const response = await fetch(`https://api.linkpreview.net/?q=${url}`, {
        method: 'POST',
        headers: {
          'X-Linkpreview-Api-Key': environment.linkPreviewKey,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data) {
        // On remplit automatiquement les champs s'ils sont vides
        if (!this.newGift.title) this.newGift.title = data.title;
        if (!this.newGift.comment) this.newGift.comment = data.description;
        this.newGift.image_url = data.image;
      }
    } catch (err) {
      console.error('Impossible de récupérer la preview', err);
    }
  }
}
