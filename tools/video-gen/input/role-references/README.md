# Role reference photos — Scene 7

Letakkan 4 foto referensi di folder ini. Nama file **wajib** seperti di bawah agar render otomatis memakainya.

| File | Role | Referensi |
|------|------|-----------|
| `01-operator.jpg` | Operator | Touchscreen di line, seragam biru, Operator Dashboard |
| `02-engineer.jpg` | Engineer | Meja + laptop/monitor, patch ENGINEERING, Investigation |
| `03-supervisor.jpg` | Supervisor | Meja control room, patch SUPERVISOR, Pending Approvals |
| `04-plant-manager.jpg` | Plant Manager | Executive dashboard di wall monitor, jas formal |

Format: JPG atau PNG (min. 1920×1080 disarankan).

## Render infografis dengan foto Anda

```bash
cd tools/video-gen
# salin 4 foto ke input/role-references/
node render_scene_07_infographic.mjs --duration 20 --fps 30
```

Tanpa foto lokal, script memakai fallback stock photo + mockup UI.

## Generate via Veo (jika belum punya foto)

```bash
python generate_scene.py --scene role-photo-operator --dry-run
python generate_scene.py --scene role-photo-operator
# ulangi: role-photo-engineer, role-photo-supervisor, role-photo-plant-manager
```

Prompt detail ada di `prompts.json` → `role_reference_photos`.

## Visual DNA (konsisten antar role)

- Patch role di lengan seragam (OPERATOR / ENGINEERING / SUPERVISOR / PLANT MANAGER)
- UI Buek Core: sidebar gelap + konten putih, logo kiri atas
- Latar: pabrik modern terlihat (line atau kaca ke floor)
- Prop role-specific: mug BUEK CORE, handbook, whiteboard, dll.
- Gaya: fotorealistik, cinematic, tidak melihat kamera
