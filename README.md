# 🔐 DevVault

Chrome Extension สำหรับนักพัฒนา - LocalStorage Manager & API Caller

## ✨ Features

### 💾 LocalStorage Manager

- ดึงค่า localStorage ตาม key (รองรับ partial match)
- ดึง localStorage ทั้งหมดในหน้าเว็บ
- บันทึก key ที่ใช้บ่อยไว้เรียกใช้ภายหลัง
- เลือก property ที่ต้องการ (เช่น access_token)
- Copy ค่าที่ได้ด้วยปุ่มเดียว
- Auto-fetch เมื่อเปิด extension

### 🌐 API Caller

- รองรับ Methods: GET, POST, PUT, DELETE
- ใส่ Custom Headers ได้ (JSON format)
- ใส่ Request Body ได้ (JSON format)
- แสดง Response พร้อม Status Code และ Response Time
- บันทึก Endpoint ที่ใช้บ่อยไว้เรียกใช้ภายหลัง
- Copy Response ด้วยปุ่มเดียว

### 📌 Side Panel

- Pin extension ไว้ด้านขวาได้
- ใช้งานได้ขณะทำงานบนหน้าเว็บ

## 📦 Installation

1. เปิด Chrome แล้วไปที่ `chrome://extensions/`
2. เปิด **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked**
4. เลือกโฟลเดอร์ `extension-support-dev`
5. Extension จะปรากฏในแถบเครื่องมือ

## 🚀 Usage

### ดึงค่า LocalStorage

1. เปิดเว็บที่ต้องการ
2. คลิกไอคอน DevVault
3. เลือก key จาก dropdown หรือพิมพ์บางส่วนของ key
4. Property selector จะให้เลือก field เช่น `access_token`
5. กด Copy ค่าที่เลือก

### ยิง API

1. เลือก Tab "API"
2. เลือก Method และใส่ Endpoint URL
3. ใส่ Headers/Body (ถ้ามี)
4. คลิก "ส่ง Request"
5. Copy Response

## 📁 Project Structure

```
extension-support-dev/
├── manifest.json     # Extension configuration
├── popup.html        # Popup interface
├── popup.css         # Styles
├── popup.js          # Logic
├── sidepanel.html    # Side panel interface
├── icons/            # Extension icons
└── README.md
```

## 🔑 Permissions

- `activeTab` - เข้าถึง tab ปัจจุบัน
- `storage` - บันทึก keys และ endpoints
- `scripting` - รัน script เพื่อดึง localStorage
- `sidePanel` - เปิดเป็น side panel ได้
- `<all_urls>` - ยิง API ไปยัง URL ใดก็ได้

## ☕ Support

[Donate](https://streamlabs.com/sl_id_5b533faf-7a77-3f55-b566-9a48b4b7fa55/tip)
