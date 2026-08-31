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
  deletedGifts = signal<Gift[]>([]);
  selectedGift = signal<Gift | null>(null);
  @ViewChild('giftModal') giftModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('detailsModal') detailsModal!: ElementRef<HTMLDialogElement>;
  @ViewChild('trashModal') trashModal!: ElementRef<HTMLDialogElement>;
  private titleService = inject(Title);
  isUploading = signal(false);

  // Objet tampon pour le nouveau cadeau (ou celui en cours de modification)
  newGift: Partial<Gift> = {
    title: '',
    comment: '',
    price: undefined,
    url: '',
    image_url: '',
    is_important: false,
    image_from_link_preview: false,
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

  getListTitle(name: string) {
    if (!name) return 'Idées cadeaux';
    return `Idées cadeaux pour ${name}`;
  }

  async loadMemberData() {
    try {
      // On récupère le profil pour avoir le nom
      const profile = await this.supabaseSvc.getProfileById(this.memberId);
      this.memberName.set(profile?.name || 'Inconnu');
      this.titleService.setTitle(this.getListTitle(this.memberName()));

      // On récupère les cadeaux liés à ce membre
      const data = await this.supabaseSvc.getGiftsByMember(this.memberId);

      // Tri : Important d'abord, puis par titre
      const sortedGifts = data.sort((a, b) => {
        if (a.is_important === b.is_important) {
          return a.title.localeCompare(b.title);
        }
        return a.is_important ? -1 : 1;
      });
      this.gifts.set(sortedGifts);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des données');
    }
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

  openGiftUpdateModal(gift: Gift) {
    this.newGift = { ...gift };
    this.giftModal.nativeElement.showModal();
  }

  closeGiftModal() {
    this.giftModal.nativeElement.close();
    this.newGift = {};
  }

  openDetailsModal(gift: Gift) {
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
      } else {
        // AJOUT
        // On s'assure que member_id est présent pour le nouvel objet
        const newObject = { ...giftData, member_id: this.memberId };
        await this.supabaseSvc.addGift(newObject);
      }
      this.closeGiftModal();
      await this.loadMemberData(); // Rafraîchit la liste dans tous les cas
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du cadeau");
    }
  }

  onBackdropClick(event: MouseEvent) {
    const dialogElement = event.target as HTMLDialogElement;
    if (dialogElement.tagName !== 'DIALOG') return;

    dialogElement.close();
    if (dialogElement === this.giftModal?.nativeElement) {
      this.newGift = {};
    }
    if (dialogElement === this.detailsModal?.nativeElement) {
      this.selectedGift.set(null);
    }
  }

  // Suppression douce : le cadeau part à la corbeille
  async deleteGift(event: Event, id: string) {
    event.stopPropagation(); // Empêche de déclencher d'autres clics
    await this.supabaseSvc.deleteGift(id);
    this.gifts.update((current) => current.filter((g) => g.id !== id));
  }

  async openTrash() {
    try {
      const deleted = await this.supabaseSvc.getDeletedGiftsByMember(this.memberId);
      this.deletedGifts.set(deleted);
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

  async restoreGift(id: string) {
    const error = await this.supabaseSvc.restoreGift(id);
    if (error) {
      alert('Erreur lors de la restauration');
      return;
    }
    this.deletedGifts.update((current) => current.filter((g) => g.id !== id));
    await this.loadMemberData();
  }

  async permanentlyDeleteGift(id: string) {
    const confirmDelete = confirm(
      'Supprimer définitivement ce cadeau ? Cette action est irréversible.',
    );
    if (!confirmDelete) return;

    const error = await this.supabaseSvc.permanentlyDeleteGift(id);
    if (error) {
      alert('Erreur lors de la suppression définitive');
      return;
    }
    this.deletedGifts.update((current) => current.filter((g) => g.id !== id));
  }

  async togglePurchased(event: Event, gift: Gift) {
    event.stopPropagation();
    if (!gift.id) return;

    const nextValue = !gift.is_purchased;
    const { error } = await this.supabaseSvc.setGiftPurchased(gift.id, nextValue);
    if (error) {
      alert('Erreur lors de la mise à jour');
      return;
    }
    this.patchGiftLocally(gift.id, { is_purchased: nextValue });
  }

  async toggleImportant(event: Event, gift: Gift) {
    event.stopPropagation();
    if (!gift.id) return;

    const nextValue = !gift.is_important;
    const { error } = await this.supabaseSvc.setGiftImportant(gift.id, nextValue);
    if (error) {
      alert('Erreur lors de la mise à jour');
      return;
    }
    this.patchGiftLocally(gift.id, { is_important: nextValue });
  }

  // Met à jour un cadeau localement (liste + modale de détails si ouverte) sans tout recharger
  private patchGiftLocally(giftId: string, patch: Partial<Gift>) {
    this.gifts.update((current) =>
      current.map((g) => (g.id === giftId ? { ...g, ...patch } : g)),
    );
    if (this.selectedGift()?.id === giftId) {
      this.selectedGift.update((g) => (g ? { ...g, ...patch } : g));
    }
  }

  printList() {
    window.print();
  }

  async reserveGift(event: Event, gift: Gift) {
    event.stopPropagation();
    if (!gift.id) return;

    const name = prompt("Ton prénom, pour indiquer que tu t'en occupes ?");
    if (!name) return;

    const { error } = await this.supabaseSvc.reserveGift(gift.id, name);
    if (error) {
      alert('Erreur lors de la réservation');
      return;
    }
    this.patchGiftLocally(gift.id, { reserved_by: name });
  }

  async releaseGift(event: Event, gift: Gift) {
    event.stopPropagation();
    if (!gift.id) return;

    const { error } = await this.supabaseSvc.reserveGift(gift.id, null);
    if (error) {
      alert('Erreur lors de la libération du cadeau');
      return;
    }
    this.patchGiftLocally(gift.id, { reserved_by: null });
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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.isUploading.set(true);

      // 1. Upload vers le bucket
      const publicUrl = await this.supabaseSvc.uploadGiftImage(file);

      // 2. Mise à jour de l'URL
      this.newGift.image_url = publicUrl;

      // 3. CRUCIAL : On indique que l'image est maintenant MANUELLE
      // Cela "écrase" l'état précédent du LinkPreview
      this.newGift.image_from_link_preview = false;

      this.isUploading.set(false);
    } catch (err) {
      console.error("Échec de l'upload immédiat :", err);
      this.isUploading.set(false);
      alert("Erreur lors de l'envoi de l'image.");
    }
  }

  ngOnDestroy() {
    // Remet le titre d'origine de ton app
    this.titleService.setTitle('Idées Cadeaux');
  }
}
