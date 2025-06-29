// Подключаем библиотеку dotenv для загрузки переменных окружения из файла .env
require('dotenv').config();

// Подключаем основную библиотеку для взаимодействия с WhatsApp Web
const { Client } = require('whatsapp-web.js');
// Подключаем библиотеку для генерации QR-кода в терминале
const qrcode = require('qrcode-terminal');
// Подключаем библиотеку OpenAI для доступа к языковым моделям
const OpenAI = require('openai');

// ✅ Проверка наличия API-ключа OpenAI
// Убедитесь, что у вас есть файл .env в той же папке, что и index.js,
// и в нем строка: OPENAI_API_KEY="ВАШ_КЛЮЧ_API_OPENAI"
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Переменная окружения OPENAI_API_KEY не установлена. Создайте файл .env с вашим ключом.");
  process.exit(1);
}

// ✅ Инициализация клиента OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Настройка клиента WhatsApp
// `whatsapp-web.js` использует Puppeteer для управления браузером.
// `args` помогают избежать проблем при запуске в разных средах.
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// 📸 Генерация QR-кода для авторизации
// Этот QR-код нужно отсканировать вашим WhatsApp-телефоном.
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log(`🔗 Отсканируй QR-код в браузере (удобнее, если терминал маленький):\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

// ✅ Бот готов к работе
client.on('ready', () => {
  console.log('✅ Бот готов и подключен к WhatsApp!');
});

// 🤖 Обработка входящих сообщений
client.on('message', async message => {
  // Игнорируем сообщения, отправленные самим ботом, чтобы избежать зацикливания
  if (!message.fromMe) {
    const prompt = message.body; // Текст входящего сообщения

    try {
      // Отправляем запрос в OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4', // Используем модель GPT-4
        messages: [
          {
            role: 'system',
            // Инструкции для GPT: как он должен отвечать.
            // Здесь задан веселый, дружелюбный и краткий стиль.
            content: 'Ты — весёлый, дружелюбный и разговорный помощник в WhatsApp. Отвечай легко, с юмором, как будто общаешься с другом. Можно использовать эмодзи, шутки и неформальный стиль. Не пиши длинно — максимум 2–4 предложения.'
          },
          { role: 'user', content: prompt } // Сообщение пользователя
        ],
        max_tokens: 120, // Ограничиваем длину ответа GPT, чтобы он был кратким
      });

      // Получаем ответ от GPT
      const reply = response.choices[0].message.content;
      // Отправляем ответ обратно в WhatsApp
      message.reply(reply);
    } catch (error) {
      console.error('❌ Ошибка при обращении к GPT:', error.message);
      // Отправляем пользователю сообщение об ошибке
      message.reply('Ой, что-то пошло не так 🤖 Попробуй ещё раз!');
    }
  }
});

// 🚀 Запуск клиента WhatsApp
client.initialize();
console.log("🚀 Инициализация клиента WhatsApp...");

// Обработка ошибок при инициализации
client.on('auth_failure', msg => {
    console.error('❌ Ошибка аутентификации:', msg);
});

client.on('disconnected', reason => {
    console.log('Бот отключен от WhatsApp, причина:', reason);
    // Можно добавить логику для автоматического переподключения, если нужно
});
