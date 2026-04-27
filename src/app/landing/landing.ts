import { Component, OnInit, signal } from '@angular/core';
import { Supabase } from '../services/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements OnInit {
  // On utilise un signal pour une UI réactive
  familyMembers = signal<any[]>([]);

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
}
