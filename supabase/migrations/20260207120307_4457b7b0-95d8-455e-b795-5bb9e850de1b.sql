
-- Create storage bucket: course-thumbnails (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true);

-- Create storage bucket: exam-assets (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-assets', 'exam-assets', true);

-- RLS: Public read for course-thumbnails
CREATE POLICY "Public can view course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- RLS: Admin/Teacher can upload to course-thumbnails
CREATE POLICY "Admin and Teacher can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);

-- RLS: Admin/Teacher can update course-thumbnails
CREATE POLICY "Admin and Teacher can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);

-- RLS: Admin/Teacher can delete from course-thumbnails
CREATE POLICY "Admin and Teacher can delete course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);

-- RLS: Public read for exam-assets
CREATE POLICY "Public can view exam assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam-assets');

-- RLS: Admin/Teacher can upload to exam-assets
CREATE POLICY "Admin and Teacher can upload exam assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);

-- RLS: Admin/Teacher can update exam-assets
CREATE POLICY "Admin and Teacher can update exam assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);

-- RLS: Admin/Teacher can delete from exam-assets
CREATE POLICY "Admin and Teacher can delete exam assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exam-assets'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
);
