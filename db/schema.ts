import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  avatarUrl: text("avatar_url"),
  mail: text("mail"),
});

export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  memberId: uuid("member_id"),
  title: text("title"),
  comment: text("comment"),
  url: text("url"),
  price: numeric("price"),
  imageUrl: text("image_url"),
  isImportant: boolean("is_important"),
  imageFromLinkPreview: boolean("image_from_link_preview"),
});
