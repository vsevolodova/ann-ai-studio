# ANN — AI-студия

Лендинг экспертной AI-студии: умные лендинги, сайты, веб-приложения и автоматизация бизнеса.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vsevolodova/ann-ai-studio)

## Что внутри

- Flask-приложение с одним лендингом и модальными окнами кейсов.
- 6 кейсов с логикой **Задача → Решение → Результат**.
- Поиск по нише, задаче, решению и стеку.
- Фильтрация по тегам и счётчик результатов.
- Glassmorphism, mesh-градиенты, scroll-reveal, tilt-эффект, параллакс, анимированный терминал и счётчики.
- Адаптивная вёрстка для компьютера и телефона.
- Форма заявки на Flask с сохранением в `leads.json`.
- Опциональная отправка заявок на почту через SMTP.

## Локальный запуск

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Сайт откроется по адресу `http://127.0.0.1:5000`.

## Структура проекта

```text
app.py          — Flask-приложение, маршруты и обработка формы
content.json    — кейсы и контактные данные
index.html      — разметка страницы
style.css       — стили, анимации и адаптивность
script.js       — поиск, фильтры, модальные окна и анимации
render.yaml     — конфигурация деплоя на Render
requirements.txt
Procfile
```

## Деплой на Render

GitHub Pages не подходит: он раздаёт только статические файлы и не умеет запускать Python/Flask.

1. Откройте кнопку **Deploy to Render** выше или создайте Web Service вручную.
2. Подключите репозиторий `vsevolodova/ann-ai-studio`.
3. Render подхватит `render.yaml`:
   - build: `pip install -r requirements.txt`
   - start: `gunicorn --bind 0.0.0.0:$PORT app:app`
4. После сборки Render выдаст публичный адрес сайта.

Бесплатный инстанс Render может засыпать после простоя — первый запуск иногда занимает до минуты.

## Отправка заявок на почту

По умолчанию заявки сохраняются в `leads.json`. На Render файловая система временная, поэтому для реального сайта лучше настроить SMTP в переменных окружения:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=ваш-логин@gmail.com
SMTP_PASSWORD=пароль-приложения
MAIL_TO=avsevolodova@gmail.com
```

Для Gmail нужен именно пароль приложения, а не обычный пароль от аккаунта.

## Контакты

- Email: avsevolodova@gmail.com
- Ярославль · работаем удалённо
