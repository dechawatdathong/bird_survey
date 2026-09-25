/* ============================================================
   ค่า Firebase config — วางค่าจาก Firebase Console ตรงนี้
   Project settings (รูปเฟือง) → Your apps → Web app → SDK setup and configuration → Config
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAioSZfwkhT3no-mfCe_uZRbee48Z-R9ro",
  authDomain: "bird-project-a17d2.firebaseapp.com",
  projectId: "bird-project-a17d2",
  storageBucket: "bird-project-a17d2.firebasestorage.app",
  messagingSenderId: "958479993885",
  appId: "1:958479993885:web:3002225371620387ab8af4"
};

// ชื่อ collection ที่เก็บคำตอบ (แยกจากข้อมูลโปรเจกต์อื่นใน Firebase เดียวกัน)
const RESPONSES_COLLECTION = "waterbird_responses";
