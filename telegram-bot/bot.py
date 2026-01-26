from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes


def main_menu() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("Site Durumu", callback_data="site_status")],
        [InlineKeyboardButton("Aktif Alarmlar", callback_data="active_alerts")],
        [InlineKeyboardButton("Vardiya Durumu", callback_data="shift_status")],
    ]
    return InlineKeyboardMarkup(keyboard)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text(
        "Operasyon merkezine hoş geldiniz. Lütfen bir seçenek seçin:",
        reply_markup=main_menu(),
    )


def build_app(token: str):
    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    return app


if __name__ == "__main__":
    import os

    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise SystemExit("TELEGRAM_BOT_TOKEN is required")

    application = build_app(bot_token)
    application.run_polling()
