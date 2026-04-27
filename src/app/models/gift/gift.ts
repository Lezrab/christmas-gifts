export interface Gift {
  id?: string; // Optionnel car généré par Supabase à l'insertion
  created_at: string; // Date de création gérée par la DB
  member_id: string; // Clé étrangère vers le profil du membre
  title: string; // Nom du cadeau
  comment?: string; // Détails (taille, couleur, etc.)
  url?: string; // Lien vers un site marchand (Amazon, etc.)
  price?: number; // Montant estimé,
  image_url?: string;
  is_important: boolean;
}
