export interface GiftComment {
  id?: string; // Optionnel car généré par Supabase à l'insertion
  created_at?: string; // Date de création gérée par la DB
  gift_id: string; // Clé étrangère vers le cadeau
  author: string; // Prénom de la personne qui commente
  content: string; // Texte du commentaire
}
