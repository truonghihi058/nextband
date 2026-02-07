

# Chuyen doi tu nhap URL sang Upload File

## Hien trang

Hien tai, he thong co 2 noi yeu cau nhap URL de tai file len:

1. **CourseForm** (`src/components/admin/CourseForm.tsx`): Truong "Anh thumbnail (URL)" - yeu cau dan link hinh anh
2. **SectionEdit** (`src/pages/admin/SectionEdit.tsx`): Truong "URL Audio (Listening)" - yeu cau dan link audio

Ca hai deu la Input text, bat nguoi dung tu tim va dan URL. Cach nay bat tien va de loi.

## Giai phap

Tao storage buckets de luu file, tao component upload file dung chung, va thay the cac input URL bang component upload thuc su.

---

## Cac buoc thuc hien

### Buoc 1: Tao Storage Buckets (Database Migration)

Tao 2 storage buckets:
- **`course-thumbnails`**: Luu anh thumbnail khoa hoc (public, cho phep xem cong khai)
- **`exam-assets`**: Luu audio, hinh anh cua bai thi (public, cho phep xem cong khai)

Tao RLS policies cho phep:
- Admin va Teacher upload/delete file
- Tat ca nguoi dung doc file (public bucket)

### Buoc 2: Tao component FileUpload dung chung

**File moi:** `src/components/admin/FileUpload.tsx`

Component nay se:
- Cho phep chon file tu may tinh (click hoac keo tha)
- Hien thi trang thai dang upload (progress)
- Upload file len storage bucket tuong ung
- Tra ve URL cua file da upload
- Hien thi preview file da upload (anh hoac audio player)
- Co nut xoa file da upload
- Ho tro gioi han loai file (image/*, audio/*)
- Ho tro gioi han kich thuoc file

Props cua component:

| Prop | Type | Mo ta |
|------|------|-------|
| bucket | string | Ten storage bucket (vd: "course-thumbnails") |
| folder | string | Thu muc con (vd: "courses/abc123") |
| accept | string | Loai file chap nhan (vd: "image/*", "audio/*") |
| currentUrl | string | URL file hien tai (neu da co) |
| onUploadComplete | (url: string) => void | Callback khi upload xong |
| onRemove | () => void | Callback khi xoa file |
| maxSizeMB | number | Gioi han kich thuoc (mac dinh 10MB) |

### Buoc 3: Cap nhat CourseForm - Upload anh thumbnail

**File:** `src/components/admin/CourseForm.tsx`

Thay doi:
- Thay Input URL (`<Input placeholder="https://...">`) bang component `<FileUpload>`
- Cau hinh: bucket = "course-thumbnails", accept = "image/*"
- Khi upload xong, tu dong cap nhat gia tri `thumbnail_url` trong form
- Hien thi preview anh hien tai neu da co
- Cap nhat validation schema: bo kiem tra URL format, chi can string

### Buoc 4: Cap nhat SectionEdit - Upload file audio

**File:** `src/pages/admin/SectionEdit.tsx`

Thay doi:
- Thay Input URL ("URL Audio") bang component `<FileUpload>`
- Cau hinh: bucket = "exam-assets", accept = "audio/*", folder = section id
- Khi upload xong, tu dong goi `updateSectionMutation` voi audio_url moi
- Hien thi audio player nho neu da co file audio
- Cho phep xoa file audio hien tai

---

## Chi tiet ky thuat

### Storage Bucket SQL Migration

```text
-- Tao bucket course-thumbnails (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true);

-- Tao bucket exam-assets (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-assets', 'exam-assets', true);

-- RLS policies cho phep admin/teacher upload
-- RLS policies cho phep public read
```

### Luong Upload File

```text
Nguoi dung chon file
       |
       v
Validate (loai file, kich thuoc)
       |
       v
Hien thi progress bar
       |
       v
Upload len Supabase Storage
  supabase.storage.from(bucket).upload(path, file)
       |
       v
Lay public URL
  supabase.storage.from(bucket).getPublicUrl(path)
       |
       v
Goi onUploadComplete(url)
       |
       v
Hien thi preview (anh hoac audio)
```

### FileUpload Component UI

Khi chua co file:
- Vung keo tha voi icon Upload, text "Keo tha file vao day hoac nhan de chon"
- Hien thi loai file chap nhan va gioi han kich thuoc

Khi dang upload:
- Progress bar voi phan tram

Khi da co file:
- Preview anh (neu la image) hoac audio player nho (neu la audio)
- Nut "Xoa" de go file va upload file moi

### Cac file can chinh sua

| File | Thay doi |
|------|----------|
| Migration SQL | Tao 2 storage buckets + RLS policies |
| `src/components/admin/FileUpload.tsx` | **TAO MOI** - Component upload file dung chung |
| `src/components/admin/CourseForm.tsx` | Thay Input URL thumbnail bang FileUpload |
| `src/pages/admin/SectionEdit.tsx` | Thay Input URL audio bang FileUpload |

