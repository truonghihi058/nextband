

# Cho phep chinh sua loai de thi va cap nhat Section tuong ung

## Hien trang

Hien tai, truong "Loai de thi" (`exam_type`) bi **khoa** khi o che do chinh sua (`mode === "edit"`), khong cho phep admin thay doi loai de thi sau khi da tao. Khi thay doi tu IELTS sang Grammar (hoac nguoc lai), cac section cu van ton tai va khong phu hop voi cau truc moi.

## Thay doi can thuc hien

### 1. Mo khoa truong exam_type trong ExamForm (edit mode)

**File:** `src/components/admin/ExamForm.tsx`

- Xoa dieu kien `mode == "edit"` khoi prop `disabled` cua Select exam_type, chi giu `isReadOnly`
- Them logic: khi nguoi dung thay doi `exam_type` trong edit mode, hien thi canh bao rang viec doi loai se **xoa tat ca sections cu** va tao lai sections moi phu hop
- Su dung AlertDialog de xac nhan truoc khi thuc hien thay doi

### 2. Them logic xoa va tao lai sections khi doi exam_type

**File:** `src/components/admin/ExamForm.tsx`

Khi submit form o edit mode voi `exam_type` da thay doi:
- Xoa tat ca `exam_sections` thuoc exam hien tai (cung cascade xoa `question_groups` va `questions` lien quan)
- Tao lai sections moi dua tren exam_type moi:
  - **IELTS**: 4 sections (Listening, Reading, Writing, Speaking)
  - **Grammar**: 1 section (General)
- Hien toast thong bao thanh cong

### 3. Cap nhat giao dien Sections trong ExamEdit

**File:** `src/pages/admin/ExamEdit.tsx`

- Them icon va color cho section type `general` (hien tai chi co 4 loai IELTS)
- Cap nhat thong bao khi khong co section: phan biet giua IELTS va Grammar
- Sau khi ExamForm luu thanh cong, invalidate ca query `exam-sections` de cap nhat danh sach sections

### 4. Cai thien GrammarSection cho de thi Grammar Viet Nam

**File:** `src/components/exam/GrammarSection.tsx`

- Them ho tro loai cau hoi `yes_no_not_given` (da co san)
- Dam bao hien thi dung cac dang cau hoi pho bien trong de thi Grammar tieng Viet: trac nghiem, dien vao cho trong, True/False/Not Given

---

## Chi tiet ky thuat

### ExamForm - Logic xu ly khi doi exam_type

```text
User thay doi exam_type
       |
       v
Hien AlertDialog canh bao:
"Doi loai de thi se xoa tat ca sections va cau hoi hien tai. Ban co chac chan?"
       |
  [Xac nhan] --> Luu exam_type moi
       |         --> DELETE FROM exam_sections WHERE exam_id = ?
       |         --> INSERT sections moi (4 IELTS hoac 1 General)
       |         --> Toast thanh cong + Refresh sections
       |
  [Huy bo] --> Khong thay doi gi
```

### ExamEdit - Bo sung icon/color cho "general"

```text
sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,    // <-- them moi
}

sectionColors = {
  ...existing,
  general: 'bg-primary text-primary-foreground',  // <-- them moi
}
```

### Cac file can chinh sua

| File | Thay doi |
|------|----------|
| `src/components/admin/ExamForm.tsx` | Mo khoa exam_type dropdown, them logic xoa/tao lai sections khi doi type |
| `src/pages/admin/ExamEdit.tsx` | Them icon/color cho `general`, invalidate sections query sau khi save |

