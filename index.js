require('dotenv').config();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Бот готов!');
});

client.on('message', async message => {
  if (!message.fromMe) {
    const prompt = message.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      const reply = response.choices[0].message.content;
      message.reply(reply);
    } catch (error) {
      console.error('❌ Ошибка GPT:', error.message);
      message.reply('Произошла ошибка при обработке запроса 🤖');
    }
  }
});

client.initialize();