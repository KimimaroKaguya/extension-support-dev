---
description: ขั้นตอนเมื่อมีการเพิ่ม requirement ใหม่ - ต้องทำ Planning และ Task ก่อน Approve
---

# Workflow: New Requirement Planning

เมื่อได้รับ requirement ใหม่จาก user ให้ทำตามขั้นตอนดังนี้:

## 1. สร้าง Implementation Plan

- สร้างหรืออัปเดตไฟล์ `implementation_plan.md` ใน artifacts directory
- ระบุรายละเอียด:
  - **Goal**: เป้าหมายของ requirement นี้
  - **Proposed Changes**: ไฟล์ที่จะแก้ไข/เพิ่มใหม่
  - **Verification Plan**: วิธีทดสอบว่าทำงานได้ถูกต้อง

## 2. สร้าง Task Checklist

- สร้างหรืออัปเดตไฟล์ `task.md` ใน artifacts directory
- แบ่ง requirement ออกเป็น sub-tasks ย่อยๆ
- ใช้ format:
  - `[ ]` สำหรับ task ที่ยังไม่ได้ทำ
  - `[/]` สำหรับ task ที่กำลังทำ
  - `[x]` สำหรับ task ที่เสร็จแล้ว

## 3. ขอ Approval จาก User

- ใช้ `notify_user` tool เพื่อส่ง plan ให้ user review
- ตั้ง `BlockedOnUser: true` เพื่อรอ feedback
- **ห้ามเริ่ม implement จนกว่าจะได้รับ approval**

## 4. หลังได้รับ Approval

- เปลี่ยน mode เป็น EXECUTION
- ทำตาม task checklist ที่วางแผนไว้
- อัปเดต task.md เมื่อทำแต่ละ task เสร็จ

## 5. Verification

- เปลี่ยน mode เป็น VERIFICATION
- ทดสอบตาม Verification Plan
- สร้าง `walkthrough.md` สรุปสิ่งที่ทำเสร็จ

---

**หมายเหตุ**: Workflow นี้ใช้กับ requirement ที่มีความซับซ้อนพอสมควร (ต้องแก้หลายไฟล์ หรือเปลี่ยนแปลง logic สำคัญ) สำหรับ request ง่ายๆ เช่น แก้ typo หรือเปลี่ยนสีปุ่ม สามารถทำได้เลยโดยไม่ต้องผ่าน workflow นี้
