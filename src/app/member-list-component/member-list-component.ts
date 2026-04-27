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
  selectedGift = signal<any>(null);
  @ViewChild('giftModal') giftModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('giftUpdateModal') giftUpdateModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('detailsModal') detailsModal!: ElementRef<HTMLDialogElement>;

  // Objet tampon pour le nouveau cadeau
  newGift: Partial<Gift> = {
    title: '',
    comment: '',
    price: undefined,
    url: '',
    image_url: '',
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
    this.giftModal.nativeElement.showModal();
  }

  closeGiftModal() {
    this.giftModal.nativeElement.close();
  }

  openGiftUpdateModal(gift: any) {
    this.newGift = { ...gift };
    this.giftUpdateModal.nativeElement.showModal();
  }

  closeGiftUpdateModal() {
    this.giftUpdateModal.nativeElement.close();
    this.newGift = {};
  }

  openDetailsModal(gift: any) {
    this.selectedGift.set(gift);
    this.detailsModal.nativeElement.showModal();
  }

  closeDetailsModal() {
    this.detailsModal.nativeElement.close();
    this.selectedGift.set(null);
  }

  async saveGift() {
    if (!this.newGift.title) return;

    try {
      if (this.newGift.id) {
        await this.supabaseSvc.updateGift(this.newGift.id, {
          title: this.newGift.title,
          comment: this.newGift.comment,
          price: this.newGift.price,
          url: this.newGift.url,
        });
        await this.loadMemberData(); // Rafraîchit la liste
        this.closeGiftUpdateModal();
      } else {
        await this.supabaseSvc.addGift(this.newGift);
        await this.loadMemberData(); // Rafraîchit la liste
        this.closeGiftModal();
      }
    } catch (err) {
      console.log(err);
      alert("Erreur lors de l'ajout du cadeau");
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'DIALOG') {
      this.closeGiftModal();
      this.closeDetailsModal();
      this.closeGiftUpdateModal();
    }
  }

  async deleteGift(event: Event, id: any) {
    event.stopPropagation(); // Empêche de déclencher d'autres clics
    await this.supabaseSvc.deleteGift(id); // À ajouter dans ton service
    this.gifts.update((current) => current.filter((g) => g.id !== id));
  }

  // Dans ta classe MemberListComponent
  isSearching = signal(false);

  async onUrlPaste() {
    const url = this.newGift.url;

    if (!url || url.trim() === '') {
      this.newGift.image_url = undefined;
      return;
    }

    // On lance le chargement
    this.isSearching.set(true);

    try {
      const response = await fetch(`https://api.linkpreview.net/?q=${url}`, {
        headers: { 'X-Linkpreview-Api-Key': environment.linkPreviewKey },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.image) {
          this.newGift.image_url = data.image;
          if (!this.newGift.title) this.newGift.title = data.title;
        }
      } else {
        this.newGift.image_url = undefined;
      }
    } catch (err) {
      this.newGift.image_url = undefined;
    } finally {
      // Dans tous les cas (succès ou erreur), on arrête la roue
      this.isSearching.set(false);
    }
  }
}
