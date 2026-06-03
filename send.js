require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// แก้ตรงนี้: ประเภทที่ต้องการส่ง และข้อความ
const TARGET_ROLE = 'นักเรียน'; // หรือ ผู้ปกครอง / บุคลากร / คนนอก
const MESSAGE = 'ประกาศ: พรุ่งนี้หยุดเรียน เนื่องจากสอบปลายภาค';

const users = JSON.parse(fs.readFileSync('./users.json'));
const targets = Object.entries(users)
  .filter(([, data]) => data.role === TARGET_ROLE)
  .map(([userId]) => userId);

console.log(`ส่งให้ ${targets.length} คน (${TARGET_ROLE})`);

targets.forEach(async (userId) => {
  try {
    await axios.post('https://api.line.me/v2/bot/message/push', {
      to: userId,
      messages: [{ type: 'text', text: MESSAGE }],
    }, {
      headers: { Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}` },
    });
    console.log(`✅ ส่งให้ ${userId} สำเร็จ`);
  } catch (err) {
    console.error(`❌ ส่งให้ ${userId} ล้มเหลว`, err.response?.data);
  }
});