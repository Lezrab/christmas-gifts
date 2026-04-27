import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Gift } from '../models/gift/gift';

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

  async updateProfile(id: string, updates: { name?: string; mail?: string; avatar_url?: string }) {
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

  async getProfileById(id: string) {
    const { data } = await this.supabase.from('profiles').select('*').eq('id', id).single();
    return data;
  }

  async getGiftsByMember(memberId: string): Promise<Gift[]> {
    const { data, error } = await this.supabase
      .from('gifts')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addGift(gift: Partial<Gift>): Promise<void> {
    const { error } = await this.supabase.from('gifts').insert([gift]);

    if (error) throw error;
  }

  async deleteGift(id: string) {
    const { error } = await this.supabase.from('gifts').delete().eq('id', id);
    return error;
  }

  async updateGift(id: string, updates: { name?: string; mail?: string; avatar_url?: string }) {
    const { data, error } = await this.supabase.from('gifts').update(updates).eq('id', id).select();
    return { data, error };
  }
}
