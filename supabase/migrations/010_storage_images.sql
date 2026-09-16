-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Storage bucket for user-uploaded images (image_banner block)
-- Run this in: Supabase Dashboard → SQL Editor (after 001-009)
-- ─────────────────────────────────────────────────────────────────

-- Public bucket: images need to be readable by anyone visiting a published
-- page (no auth), same trust model as the page content itself. Writes are
-- restricted below by RLS on storage.objects, not by the bucket being
-- private -- a private bucket would need a signed URL per image on every
-- page load, which public pages don't do anywhere else in this project.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Folder-per-user convention: every object's path starts with the
-- uploader's auth.uid(), e.g. "3fa8.../<uuid>.jpg" -- storage.foldername()
-- splits the path on "/" and [1] is that first segment. This is the
-- standard Supabase Storage pattern for "users can only touch their own
-- files" and mirrors how `payments`/`loyalty_cards` scope rows to owners.
create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own images"
  on storage.objects for update
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
