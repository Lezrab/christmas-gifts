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
}
