import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../services/supabase';
import { Gift } from '../models/gift/gift';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { Title } from '@angular/platform-browser';

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
  private titleService = inject(Title);
  selectedFile: File | null = null;
  isUploading = signal(false);

  // Objet tampon pour le nouveau cadeau
  newGift: Partial<Gift> = {
    title: '',
    comment: '',
    price: undefined,
    url: '',
    image_url: '',
    is_important: false,
    image_from_link_preview: false
  };

  currentYear = new Date().getFullYear();
  availableYears = [
    this.currentYear,
    this.currentYear + 1,
    this.currentYear + 2,
    this.currentYear + 3,
  ];

  selectedYears = signal<number[]>([]);
  filteredGifts = computed(() => {
    const years = this.selectedYears();
    const allGifts = this.gifts();

    // Si aucune année n'est sélectionnée, on affiche tout
    if (years.length === 0) return allGifts;

    return allGifts.filter((gift) => {
      if (!gift.created_at) return false;

      // Extraction robuste de l'année
      const giftYear = parseInt(gift.created_at.split('-')[0]);

      // On garde l'objet si son année est présente dans notre tableau de filtres
      return years.includes(giftYear);
    });
  });

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
    this.titleService.setTitle(`La hotte de ${profile?.name}`);

    // On récupère les cadeaux liés à ce membre
    const data = await this.supabaseSvc.getGiftsByMember(this.memberId);
    if (data) {
      // Tri : Important d'abord, puis par titre
      const sortedGifts = data.sort((a, b) => {
        if (a.is_important === b.is_important) {
          return a.title.localeCompare(b.title);
        }
        return a.is_important ? -1 : 1;
      });
      this.gifts.set(sortedGifts);
    }
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
      is_important: false,
      image_url: '',
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

    const giftData = { ...this.newGift };

    // On ajoute l'URL seulement si elle passe le test
    if (this.isValidUrl(this.newGift.url)) {
      giftData.url = this.newGift.url;
    } else {
      giftData.url = ''; // Ou on laisse undefined selon ta structure BDD
      if (giftData.image_from_link_preview) {
        giftData.image_url = '';
      }
    }

    try {
      if (this.newGift.id) {
        // MODIFICATION
        await this.supabaseSvc.updateGift(this.newGift.id, giftData);
        this.closeGiftUpdateModal();
      } else {
        // AJOUT
        // On s'assure que member_id est présent pour le nouvel objet
        const newObject = { ...giftData, member_id: this.memberId };
        await this.supabaseSvc.addGift(newObject);
        this.closeGiftModal();
      }
      await this.loadMemberData(); // Rafraîchit la liste dans tous les cas
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du cadeau");
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
          this.newGift.title = data.title;
          this.newGift.image_from_link_preview = true;
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

  isValidUrl(url: string | undefined): boolean {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url); // Tente de construire l'URL
      return true;
    } catch {
      return false;
    }
  }

  getYear(dateString: string | undefined): string {
    if (!dateString) return new Date().getFullYear().toString();
    return new Date(dateString).getFullYear().toString();
  }

  formatDateFr(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Configuration du formatage en français
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedDate = formatter.format(date);

    // Optionnel : Mettre la première lettre en majuscule (Lundi...)
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }

  toggleYearFilter(year: number) {
    const currentFilters = this.selectedYears();

    if (currentFilters.includes(year)) {
      // Si l'année est déjà là, on la retire (Désélection)
      this.selectedYears.set(currentFilters.filter((y) => y !== year));
    } else {
      // Sinon, on l'ajoute au tableau (Cumul)
      this.selectedYears.set([...currentFilters, year]);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.isUploading.set(true);

      // On lance l'upload immédiatement vers Supabase Storage
      const publicUrl = await this.supabaseSvc.uploadGiftImage(file);

      // On met à jour l'URL de l'image directement dans l'objet tampon
      // Cela remplace l'image du LinkPreview par celle du bucket
      this.newGift.image_url = publicUrl;

      this.isUploading.set(false);
    } catch (err) {
      console.error("Échec de l'upload immédiat :", err);
      this.isUploading.set(false);
      alert("Erreur lors de l'envoi de l'image.");
    }
  }

  ngOnDestroy() {
    // Remet le titre d'origine de ton app
    this.titleService.setTitle('Mon App Cadeaux 🎁');
  }
}
