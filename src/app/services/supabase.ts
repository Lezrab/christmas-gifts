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
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async addProfile(name: string) {
    const { data, error } = await this.supabase.from('profiles').insert([{ name }]).select();
    if (error) throw error;
    return data;
  }

  // Suppression douce : le profil part à la corbeille au lieu d'être supprimé
  async deleteProfile(id: string) {
    const { error } = await this.supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    return error;
  }

  async getDeletedProfiles() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async restoreProfile(id: string) {
    const { error } = await this.supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', id);
    return error;
  }

  async permanentlyDeleteProfile(id: string) {
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

  private generateFileName(file: File): string {
    const fileExt = file.name.split('.').pop();
    return `${Math.random()}-${Date.now()}.${fileExt}`;
  }

  async uploadAvatar(file: File) {
    const filePath = `public/${this.generateFileName(file)}`;

    const { error } = await this.supabase.storage.from('avatars').upload(filePath, file);

    if (error) throw error;

    // Récupère l'URL publique
    const { data } = this.supabase.storage.from('avatars').getPublicUrl(filePath);

    return data.publicUrl;
  }

  async getProfileById(id: string) {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async getGiftsByMember(memberId: string): Promise<Gift[]> {
    const { data, error } = await this.supabase
      .from('gifts')
      .select('*')
      .eq('member_id', memberId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addGift(gift: Partial<Gift>): Promise<void> {
    const { error } = await this.supabase.from('gifts').insert([gift]);

    if (error) throw error;
  }

  // Suppression douce : le cadeau part à la corbeille au lieu d'être supprimé
  async deleteGift(id: string) {
    const { error } = await this.supabase
      .from('gifts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    return error;
  }

  async getDeletedGiftsByMember(memberId: string): Promise<Gift[]> {
    const { data, error } = await this.supabase
      .from('gifts')
      .select('*')
      .eq('member_id', memberId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async restoreGift(id: string) {
    const { error } = await this.supabase.from('gifts').update({ deleted_at: null }).eq('id', id);
    return error;
  }

  async permanentlyDeleteGift(id: string) {
    const { error } = await this.supabase.from('gifts').delete().eq('id', id);
    return error;
  }

  async updateGift(
    id: string,
    updates: { title?: string; comment?: string; url?: string; price?: number; is_purchased?: boolean },
  ) {
    const { data, error } = await this.supabase.from('gifts').update(updates).eq('id', id).select();
    return { data, error };
  }

  async uploadGiftImage(file: File): Promise<string> {
    const fileName = this.generateFileName(file);

    const { error: uploadError } = await this.supabase.storage
      .from('human_image_url')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = this.supabase.storage.from('human_image_url').getPublicUrl(fileName);

    return data.publicUrl;
  }

  async setGiftPurchased(id: string, isPurchased: boolean) {
    const { data, error } = await this.supabase
      .from('gifts')
      .update({ is_purchased: isPurchased })
      .eq('id', id)
      .select();
    return { data, error };
  }

  async setGiftImportant(id: string, isImportant: boolean) {
    const { data, error } = await this.supabase
      .from('gifts')
      .update({ is_important: isImportant })
      .eq('id', id)
      .select();
    return { data, error };
  }

  async reserveGift(id: string, reservedBy: string | null) {
    const { data, error } = await this.supabase
      .from('gifts')
      .update({ reserved_by: reservedBy })
      .eq('id', id)
      .select();
    return { data, error };
  }
}
