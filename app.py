"""
ANN — AI-студия.
Запуск: python app.py
Сайт откроется по адресу http://127.0.0.1:5000
"""

import json
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from flask import Flask, redirect, render_template, request, send_from_directory, url_for

BASE_DIR = Path(__file__).resolve().parent

# Шаблон и файлы сайта лежат рядом с app.py — так проект проще читать.
app = Flask(__name__, template_folder=str(BASE_DIR), static_folder=None)


def load_content():
    """Читаем тексты и кейсы из content.json."""
    with open(BASE_DIR / "content.json", encoding="utf-8") as file:
        return json.load(file)


def collect_tags(cases):
    """Собираем уникальные теги в том порядке, в котором они встречаются."""
    tags = []
    for case in cases:
        for tag in case.get("tags", []):
            if tag not in tags:
                tags.append(tag)
    return tags


def prepare_cases(cases):
    """Добавляем в каждый кейс строку для быстрого поиска."""
    for case in cases:
        details = case.get("details", {})
        search_parts = [
            case.get("category", ""),
            case.get("title", ""),
            case.get("summary", ""),
            case.get("task", ""),
            case.get("solution", ""),
            case.get("result", ""),
            " ".join(case.get("tags", [])),
            details.get("intro", ""),
            " ".join(details.get("challenge", [])),
            " ".join(details.get("actions", [])),
            " ".join(details.get("stack", [])),
        ]
        case["search_text"] = " ".join(search_parts).lower()
    return cases


def save_lead(lead):
    """Сохраняем заявку в leads.json. Файл создаётся автоматически."""
    leads_path = BASE_DIR / "leads.json"
    leads = []

    if leads_path.exists():
        try:
            leads = json.loads(leads_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            leads = []

    leads.append(lead)
    leads_path.write_text(
        json.dumps(leads, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def send_lead_by_email(lead):
    """
    Необязательная отправка письма.
    Чтобы включить её, задайте переменные окружения:
    SMTP_HOST, SMTP_USER, SMTP_PASSWORD.
    """
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")

    if not all([host, user, password]):
        return False

    message = EmailMessage()
    message["Subject"] = f"Новая заявка с сайта ANN — {lead['name']}"
    message["From"] = user
    message["To"] = os.getenv("MAIL_TO", "avsevolodova@gmail.com")
    message.set_content(
        f"Имя: {lead['name']}\n"
        f"Контакт: {lead['contact']}\n"
        f"Бюджет: {lead['budget']}\n\n"
        f"Задача:\n{lead['message']}\n\n"
        f"Дата: {lead['created_at']}"
    )

    try:
        with smtplib.SMTP_SSL(host, int(os.getenv("SMTP_PORT", "465"))) as server:
            server.login(user, password)
            server.send_message(message)
        return True
    except Exception as error:  # pragma: no cover
        print(f"Не удалось отправить письмо: {error}")
        return False


@app.get("/")
def index():
    content = load_content()
    cases = prepare_cases(content["cases"])

    return render_template(
        "index.html",
        site=content["site"],
        cases=cases,
        tags=collect_tags(cases),
        sent=request.args.get("sent") == "1",
        error=request.args.get("error") == "1",
        year=datetime.now().year,
    )


@app.get("/style.css")
def styles():
    return send_from_directory(BASE_DIR, "style.css", mimetype="text/css")


@app.get("/script.js")
def scripts():
    return send_from_directory(BASE_DIR, "script.js", mimetype="text/javascript")


@app.post("/contact")
def contact():
    name = request.form.get("name", "").strip()
    contact_value = request.form.get("contact", "").strip()
    budget = request.form.get("budget", "Не указан").strip()
    message = request.form.get("message", "").strip()

    # Скрытое поле-ловушка для простых спам-ботов.
    if request.form.get("company"):
        return redirect(url_for("index", sent=1) + "#contact")

    if not name or not contact_value or not message:
        return redirect(url_for("index", error=1) + "#contact")

    lead = {
        "name": name,
        "contact": contact_value,
        "budget": budget,
        "message": message,
        "created_at": datetime.now().strftime("%d.%m.%Y %H:%M"),
    }

    save_lead(lead)
    send_lead_by_email(lead)

    return redirect(url_for("index", sent=1) + "#contact")


if __name__ == "__main__":
    app.run(debug=True)
