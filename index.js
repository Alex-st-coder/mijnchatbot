// Подключаем библиотеку dotenv для загрузки переменных окружения из файла .env
require('dotenv').config();

// Подключаем основную библиотеку для взаимодействия с WhatsApp Web
const { Client } = require('whatsapp-web.js');
// Подключаем библиотеку для генерации QR-кода в терминале
const qrcode = require('qrcode-terminal');
// Подключаем библиотеку OpenAI для доступа к языковым моделям
const OpenAI = require('openai');

// ✅ Проверка наличия API-ключа OpenAI
// Это критически важный шаг: если ключ не установлен, бот не сможет работать с OpenAI.
// Программа завершает работу, если переменная окружения отсутствует.
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Переменная окружения OPENAI_API_KEY не установлена.");
  // Выход из процесса с ошибкой
  process.exit(1);
}

// ✅ Инициализация клиента OpenAI
// Создаем экземпляр OpenAI с использованием API-ключа из переменных окружения.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Настройка клиента WhatsApp
// Создаем новый экземпляр клиента WhatsApp.
// Объект `puppeteer` содержит настройки для Puppeteer, который используется whatsapp-web.js
// для управления браузером Chromium.
const client = new Client({
  puppeteer: {
    // `args` - это массив аргументов, передаваемых в Chromium.
    // `--no-sandbox`: Отключает песочницу Chromium. Это часто необходимо при запуске в
    // контейнеризированных средах (например, Docker, Railway), где песочница может
    // конфликтовать с настройками безопасности контейнера.
    // `--disable-setuid-sandbox`: Отключает setuid-песочницу. Также полезно для
    // сред, где обычная песочница не работает.
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// 📸 Генерация QR-кода для авторизации
// Событие 'qr' срабатывает, когда WhatsApp Web требует сканирования QR-кода для авторизации.
client.on('qr', qr => {
  // Генерируем и отображаем QR-код прямо в терминале.
  qrcode.generate(qr, { small: true });
  // Также выводим ссылку на онлайн-генератор QR-кодов, чтобы можно было
  // сканировать его с другого устройства, если терминал не поддерживает отображение.
  console.log(`🔗 Сканируй QR-код в браузере:\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

// ✅ Бот готов к работе
// Событие 'ready' срабатывает, когда клиент WhatsApp успешно авторизован и готов
// принимать и отправлять сообщения.
client.on('ready', () => {
  console.log('✅ Бот готов!');
});

// 🤖 Обработка входящих сообщений
// Событие 'message' срабатывает при получении нового сообщения.
client.on('message', async message => {
  // Проверяем, что сообщение не отправлено самим ботом (чтобы избежать бесконечных циклов).
  if (!message.fromMe) {
    // Получаем текст сообщения от пользователя.
    const prompt = message.body;

    try {
      // Отправляем запрос к API OpenAI (модель gpt-4).
      // `messages` - это массив объектов, представляющих диалог.
      // Здесь мы отправляем только одно сообщение от пользователя.
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      // Извлекаем ответ от GPT.
      // `response.choices[0].message.content` содержит текст сгенерированного ответа.
      const reply = response.choices[0].message.content;
      // Отправляем ответ обратно в WhatsApp.
      message.reply(reply);
    } catch (error) {
      // Обработка ошибок, которые могут возникнуть при взаимодействии с OpenAI.
      console.error('❌ Ошибка GPT:', error.message);
      // Отправляем пользователю сообщение об ошибке.
      message.reply('Произошла ошибка при обработке запроса 🤖');
    }
  }
});

// 🚀 Запуск клиента WhatsApp
// Инициализируем клиент, что запускает процесс подключения к WhatsApp Web.
client.initialize();
console.log("🚀 Инициализация клиента...");
