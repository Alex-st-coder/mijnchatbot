require('dotenv').config();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');

// ✅ Проверка наличия API-ключа
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Переменная окружения OPENAI_API_KEY не установлена.");
  process.exit(1);
}

// ✅ Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Настройка клиента WhatsApp
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// 📸 QR-код для авторизации
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// ✅ Бот готов
client.on('ready', () => {
  console.log('✅ Бот готов!');
});

// 🤖 Обработка сообщений
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

// 🚀 Запуск бота
client.initialize();
console.log("🚀 Инициализация клиента...");