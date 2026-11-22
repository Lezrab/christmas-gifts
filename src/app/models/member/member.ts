export type SizeCategory = 'haut' | 'bas' | 'chaussures' | 'chaussettes';
// Plusieurs tailles possibles par catégorie (ex : haut M ou L)
export type MemberSizes = Partial<Record<SizeCategory, string[]>>;

export interface Member {
  id: string;
  name: string;
  mail?: string; // Retiré du formulaire pour le moment (pas encore de notifications par mail)
  avatar_url: string;
  color?: string;
  sizes?: MemberSizes | null;
  notes?: string | null; // Précisions libres (allergies, couleurs préférées...)
  deleted_at?: string | null;
}
