# แบบสำรวจการติดตามนกน้ำอพยพและถิ่นที่อยู่อาศัย (ภาคประชาชน)

เว็บ static (ไม่มี build step) เก็บคำตอบลง **Firebase Firestore** และ deploy ผ่าน **Vercel** อัตโนมัติเมื่อ push ขึ้น GitHub

## โครงสร้างไฟล์
- `index.html` — โครงหน้าเว็บ
- `style.css` — ธีมและสไตล์
- `script.js` — คำถาม ข้อมูลนก 31 ชนิด ตรวจความครบถ้วน ส่งข้อมูล หน้าผู้ดูแล ส่งออก Excel
- `firebase-config.js` — **ค่า Firebase config (ต้องแก้)**
- `firestore.rules` — กฎความปลอดภัยของ Firestore (คัดลอกไปวางใน Console)
- `assets/logo-onep.png` — ตราสัญลักษณ์ สผ.
- `assets/birds/` — รูปนกน้ำ b1.jpg–b31.jpg

## ตั้งค่าครั้งแรก

### 1. Firebase config
ใส่ค่าของโปรเจกต์ `bird-project-a17d2` ไว้ใน `firebase-config.js` แล้ว
ถ้ายังไม่ได้สร้างฐานข้อมูล: Firebase Console → **Build → Firestore Database → Create database**
เลือก location `asia-southeast1` (สิงคโปร์) และเลือก **production mode**
คำตอบจะเก็บใน collection `waterbird_responses`

### 2. ตั้งกฎ Firestore
Firebase Console → **Firestore Database → Rules** → คัดลอกเนื้อหา `firestore.rules` ไปวาง
กด **Publish**

> หน้า `#admin` ไม่ต้องล็อกอิน ใครที่รู้ลิงก์ก็ดูสรุปผลและลบข้อมูลได้ ควรแชร์ลิงก์ `#admin` เฉพาะผู้ดูแล

### 3. Deploy
push ไฟล์ทั้งหมดขึ้น GitHub repo ที่เชื่อมกับ Vercel ไว้ Vercel จะ deploy ให้อัตโนมัติ
ถ้าเป็น repo ใหม่: vercel.com → Add New → Project → Import repo → Framework Preset: **Other** → Deploy

## ใช้งาน
- แบบสำรวจ: เปิดลิงก์เว็บตามปกติ
- ผู้ดูแลระบบ: เติม `#admin` ท้ายลิงก์ เช่น `https://ชื่อเว็บ.vercel.app/#admin`
  ดูสรุปผล ดาวน์โหลด Excel และลบข้อมูลทั้งหมดได้
