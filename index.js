require('dotenv').config();
const express = require('express');
const { messagingApi, middleware, HTTPFetchError } = require('@line/bot-sdk');
const fs = require('fs');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new messagingApi.MessagingApiClient(config);
const app = express();

const USERS_FILE = './users.json';
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ status: 'ok' }))
    .catch((err) => { console.error(err); res.status(500).end(); });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text.trim();
  const users = loadUsers();

  const roles = ['นักเรียน', 'ผู้ปกครอง', 'บุคลากร', 'คนนอก'];
  if (roles.includes(text)) {
    users[userId] = { role: text, registeredAt: new Date().toISOString() };
    saveUsers(users);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: `✅ บันทึกแล้ว! คุณเป็น "${text}" จะได้รับข่าวสารที่เกี่ยวข้องครับ` }]
    });
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{
      type: 'template',
      altText: 'กรุณาเลือกประเภทของคุณ',
      template: {
        type: 'buttons',
        text: 'กรุณาเลือกว่าคุณเป็นใคร',
        actions: roles.map(role => ({
          type: 'message', label: role, text: role
        }))
      }
    }]
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
