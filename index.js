// Подключаем библиотеку dotenv для загрузки переменных окружения из файла .env
require('dotenv').config();

// Подключаем основную библиотеку для взаимодействия с WhatsApp Web
const { Client } = require('whatsapp-web.js');
// Подключаем библиотеку для генерации QR-кода в терминале
const qrcode = require('qrcode-terminal');
// Подключаем библиотеку OpenAI для доступа к языковым моделям
const OpenAI = require('openai');

// ✅ Проверка наличия API-ключа OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Переменная окружения OPENAI_API_KEY не установлена.");
  process.exit(1);
}

// ✅ Инициализация клиента OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Настройка клиента WhatsApp
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// 📸 Генерация QR-кода для авторизации
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log(`🔗 Сканируй QR-код в браузере:\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

// ✅ Бот готов к работе
client.on('ready', () => {
  console.log('✅ Бот готов!');
});

// 🤖 Обработка входящих сообщений
client.on('message', async message => {
  if (!message.fromMe) {
    const prompt = message.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Ты — весёлый, дружелюбный и разговорный помощник в WhatsApp. Отвечай легко, с юмором, как будто общаешься с другом. Можно использовать эмодзи, шутки и неформальный стиль. Не пиши длинно — максимум 2–4 предложения.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 120,
      });

      const reply = response.choices[0].message.content;
      message.reply(reply);
    } catch (error) {
      console.error('❌ Ошибка GPT:', error.message);
      message.reply('Ой, что-то пошло не так 🤖 Попробуй ещё раз!');
    }
  }
});

// 🚀 Запуск клиента WhatsApp
client.initialize();
console.log("🚀 Инициализация клиента...");
