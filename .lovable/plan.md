

# Lam lai giao dien quan tri va hoc sinh cho Grammar Section linh hoat

## Van de hien tai

Giao dien hien tai qua cung nhac, khong phu hop voi cau truc de thi Grammar thuc te tai Viet Nam:

1. **Admin (SectionEdit)**: Tao cau hoi bang Dialog, moi lan chi 1 cau, rat cham va bat tien
2. **Question types thieu**: Database chi co `multiple_choice`, `fill_blank`, `matching`, `essay`, `speaking` - thieu `short_answer`, `true_false_not_given`, `yes_no_not_given`
3. **Student (GrammarSection)**: Khong ho tro dang `essay` (textarea dai), khong hien thi passage trong nhom cau hoi

## Cau truc de thi thuc te can ho tro

Dua tren mau de cua ban:

| Dang bai | Loai cau hoi | Giao dien hoc sinh |
|----------|-------------|---------------------|
| Dich cau Viet-Anh | `short_answer` | Input text 1 dong |
| Nhan dien S-V (viet lai cau) | `short_answer` | Input text 1 dong |
| Doc hieu + dien tu | `fill_blank` | Input ngan (1 tu/so) |
| Tra loi cau hoi mo | `essay` | Textarea nhieu dong |
| Dich cau dung collocation | `short_answer` | Input text 1 dong |
| Phat hien loi + viet lai | `short_answer` | Input text 1 dong |
| Trac nghiem | `multiple_choice` | Radio buttons |

## Cac buoc thuc hien

### Buoc 1: Bo sung question_type vao database enum

**Migration SQL** - Them 3 gia tri moi vao enum `question_type`:
- `short_answer` - Tra loi ngan (1-2 cau)
- `true_false_not_given`
- `yes_no_not_given`

### Buoc 2: Thiet ke lai giao dien Admin SectionEdit cho Grammar

**File:** `src/pages/admin/SectionEdit.tsx`

Thay doi lon: Chuyen tu Dialog-based sang **Inline Editing** va them tinh nang **Bulk Import** (nhap nhieu cau hoi cung luc).

#### 2a. Inline Editing cho Question Groups

Thay vi mo Dialog de tao/sua nhom, cho phep **chinh sua truc tiep tren trang**:
- Nhom cau hoi hien thi dang card co the expand/collapse (giu Accordion hien tai)
- Nhan vao tieu de/passage/instructions de chinh sua truc tiep (click-to-edit)
- Khong can mo Dialog rieng nua

#### 2b. Bulk Question Import

Them tinh nang **"Nhap nhanh"**: Admin paste nhieu cau hoi cung luc, moi dong la 1 cau hoi.

Cach hoat dong:
- Nhan nut "Nhap nhanh" -> hien Textarea lon
- Dan nhieu cau hoi (moi dong la 1 cau)
- Chon loai cau hoi chung cho tat ca (vd: `short_answer`)
- Nhan "Tao tat ca" -> he thong tu dong tao cac cau hoi rieng le

Vi du admin dan:
```
Nhieu hoc sinh cam thay cang thang truoc ky thi. (feel stressed)
Sinh vien can chu y khi giao vien giai thich bai. (pay attention to)
Toi thuong danh thoi gian cho gia dinh vao cuoi tuan. (spend time with)
```
-> He thong tao 3 cau hoi `short_answer` tu dong.

#### 2c. Cap nhat danh sach Question Types

Mo rong danh sach QUESTION_TYPES trong admin:
- Them `short_answer` (Tra loi ngan)
- Them `true_false_not_given` (TRUE/FALSE/NOT GIVEN)
- Them `yes_no_not_given` (YES/NO/NOT GIVEN)

#### 2d. Sua lai Group Dialog

- Them truong "Loai nhom" nhu 1 goi y (Translation, Reading Comprehension, Error Correction, Open Writing...) - chi la label, khong luu vao DB
- Giu nguyen passage va instructions nhung cai thien placeholder cho phu hop Grammar

### Buoc 3: Cap nhat giao dien hoc sinh GrammarSection

**File:** `src/components/exam/GrammarSection.tsx`

Them ho tro cac dang cau hoi moi:

| question_type | Hien thi |
|---------------|---------|
| `short_answer` | Input text (1 dong, rong hon fill_blank) |
| `essay` | Textarea (nhieu dong, co dem tu) |
| `fill_blank` | Input ngan (1 tu) - giu nguyen |
| `multiple_choice` | Radio - giu nguyen |
| `true_false_not_given` | Dropdown - giu nguyen |
| `yes_no_not_given` | Dropdown - giu nguyen |

Them hien thi passage cua nhom (neu co) - dung cho dang doc hieu trong de Grammar.

### Buoc 4: Toi uu trai nghiem hoc sinh

**File:** `src/components/exam/GrammarSection.tsx`

- Hien thi tieu de nhom noi bat hon (co so thu tu phan, vd "PHAN 1", "PHAN 2")
- Hien thi huong dan nhom (instructions) trong Card rieng voi style noi bat
- Hien thi passage cua nhom (neu co) trong Card xam, truoc cac cau hoi
- Voi `essay` type: hien thi Textarea co dem so tu o goc
- Voi `short_answer` type: hien thi Input voi placeholder "Nhap cau tra loi..."

---

## Chi tiet ky thuat

### Database Migration

```text
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'short_answer';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'true_false_not_given';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'yes_no_not_given';
```

### Bulk Import - Logic xu ly

```text
Admin dan text vao Textarea
       |
       v
Tach theo dong (split by newline)
       |
       v
Loc bo dong trong
       |
       v
Voi moi dong: tao 1 question {
  question_text: noi dung dong,
  question_type: loai da chon,
  order_index: so thu tu,
  group_id: nhom hien tai,
  points: 1
}
       |
       v
Batch insert vao DB
       |
       v
Refresh danh sach cau hoi
```

### GrammarSection - Cau truc hien thi moi

```text
Section Title
Section Instructions (Card xam)

--- NHOM 1 ---
Group Title (in dam, co icon phan)
Group Instructions (Card xam nho)
Group Passage (Card co nen, neu co)

  Cau 1: [question_text]
         [Input / Textarea / Radio / Dropdown tuy question_type]
  
  Cau 2: [question_text]
         [Input / Textarea / Radio / Dropdown tuy question_type]

--- NHOM 2 ---
Group Title
...
```

### Cac file can chinh sua

| File | Thay doi |
|------|----------|
| Migration SQL | Them `short_answer`, `true_false_not_given`, `yes_no_not_given` vao enum |
| `src/pages/admin/SectionEdit.tsx` | Them Bulk Import, cap nhat QUESTION_TYPES, cai thien UX |
| `src/components/exam/GrammarSection.tsx` | Ho tro `essay`, `short_answer`, hien thi passage trong nhom |

