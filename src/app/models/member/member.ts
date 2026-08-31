export interface Member {
  id: string;
  name: string;
  mail?: string; // Retiré du formulaire pour le moment (pas encore de notifications par mail)
  avatar_url: string;
  color?: string;
  deleted_at?: string | null;
}
