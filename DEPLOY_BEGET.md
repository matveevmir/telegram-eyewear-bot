# 🚀 Развертывание Telegram-бота на Beget

## Что касается привязки к личному номеру

❗ **Важно понимать:** Telegram боты не привязываются к личным номерам телефона. Это отдельные сущности.

**Но есть решение для вашей задачи:**
1. Клиенты будут писать вашему **боту** (не вам лично)
2. Бот будет автоматически отвечать через ИИ-агента
3. **Вы получите возможность управления:** включать/выключать ИИ или отвечать вручную

## 📋 Пошаговая инструкция развертывания

### Шаг 1: Подготовка VPS на Beget

1. **Заказ VPS:**
   - Перейдите на `beget.com/ru/cloud/marketplace/nodejs`
   - Выберите VPS с предустановленным Node.js (от 290₽/месяц)
   - Получите данные для SSH-доступа

2. **Подключение к серверу:**
   ```bash
   ssh username@your-server-ip
   ```

### Шаг 2: Развертывание приложения

```bash
# Создание директории для бота
mkdir ~/telegram-eyewear-bot
cd ~/telegram-eyewear-bot

# Загрузка проекта из Replit
# Скачайте архив проекта из Replit или используйте git
wget "ссылка-на-архив-проекта" -O project.zip
unzip project.zip

# Установка зависимостей
npm install

# Создание файла переменных окружения
nano .env
```

### Шаг 3: Настройка переменных окружения

В файле `.env` укажите:
```bash
# База данных (если используете внешнюю)
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Telegram Bot Token (получите в @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# ID администратора (ваш Telegram ID)
ADMIN_TELEGRAM_ID=your-telegram-id

# Порт приложения
PORT=3000
```

### Шаг 4: Запуск и настройка автозапуска

```bash
# Запуск через PM2 (процесс-менеджер)
pm2 start npm --name "eyewear-bot" -- start

# Настройка автозапуска при перезагрузке сервера
pm2 startup
pm2 save

# Проверка статуса
pm2 status

# Просмотр логов
pm2 logs eyewear-bot
```

### Шаг 5: Настройка Nginx (если нужен веб-интерфейс)

```bash
# Редактирование конфигурации Nginx
sudo nano /etc/nginx/sites-available/eyewear-bot

# Содержимое файла:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Активация сайта
sudo ln -s /etc/nginx/sites-available/eyewear-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🤖 Создание и настройка Telegram-бота

### Шаг 1: Создание бота через BotFather

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте `/start`, затем `/newbot`
3. Введите имя бота: `LooKee Очки Консультант`
4. Введите username: `lookee_glasses_bot` (должен заканчиваться на `bot`)
5. **Сохраните полученный токен!** Формат: `1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Шаг 2: Дополнительная настройка бота

```bash
# В BotFather выполните команды:
/setdescription    # Описание: "Помощник по подбору очков LooKee"
/setabouttext      # О боте: "Консультирую по солнцезащитным и компьютерным очкам"
/setuserpic        # Загрузите логотип магазина
/setcommands       # Настройте команды:
start - Начать общение
help - Помощь
catalog - Каталог очков
delivery - Условия доставки
```

### Шаг 3: Получение вашего Telegram ID

1. Напишите боту **@userinfobot**
2. Он покажет ваш Telegram ID (число вида `123456789`)
3. Укажите этот ID в переменной `ADMIN_TELEGRAM_ID`

## 🎮 Управление ботом

После развертывания у вас будут следующие возможности:

### Команды администратора:
- `/bot_auto_on` - Включить автоответы ИИ
- `/bot_auto_off` - Выключить автоответы (отвечайте вручную)
- `/stats` - Статистика обращений
- `/broadcast текст` - Рассылка всем пользователям

### Уведомления:
- Вы получите уведомление о каждом новом сообщении клиента
- Сможете выбирать: отвечать самому или дать ответить ИИ

## 🔧 Полезные команды для управления

```bash
# Перезапуск бота
pm2 restart eyewear-bot

# Просмотр логов
pm2 logs eyewear-bot --lines 100

# Обновление бота
cd ~/telegram-eyewear-bot
git pull    # если используете git
npm install  # если обновлялись зависимости
pm2 restart eyewear-bot

# Мониторинг производительности
pm2 monit
```

## 💰 Примерная стоимость

- **VPS на Beget:** от 290₽/месяц
- **OpenAI API:** ~$3-10/месяц (в зависимости от нагрузки)
- **Домен:** ~300₽/год (опционально)

**Итого:** ~600₽/месяц за полнофункциональный ИИ-консультант для вашего магазина

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs eyewear-bot`
2. Статус процессов: `pm2 status`
3. Техподдержка Beget: круглосуточно
4. Документация Telegram Bot API: https://core.telegram.org/bots/api