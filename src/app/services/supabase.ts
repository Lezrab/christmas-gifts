import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getProfiles() {
    const { data, error } = await this.supabase.from('profiles').select('*').order('name');
    return data || [];
  }

  async addProfile(name: string) {
    const { data, error } = await this.supabase.from('profiles').insert([{ name }]).select();
    return data;
  }

  async deleteProfile(id: string) {
    const { error } = await this.supabase.from('profiles').delete().eq('id', id);
    return error;
  }

  async updateProfile(id: string, updates: { name?: string; avatar_url?: string }) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async uploadAvatar(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error } = await this.supabase.storage.from('avatars').upload(filePath, file);

    if (error) throw error;

    // Récupère l'URL publique
    const { data } = this.supabase.storage.from('avatars').getPublicUrl(filePath);

    return data.publicUrl;
  }
}
