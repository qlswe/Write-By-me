import { Language } from '../data/translations';

/**
 * Translates technical Firebase/Google auth error codes into highly detailed,
 * human-friendly explanation messages in Russian and English.
 */
export function getHumanFriendlyError(error: any, lang: Language): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (lang === 'ru') {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Этот адрес почты уже занят другим аккаунтом. Если вы забыли пароль, попробуйте восстановить его, либо войдите через эту почту.';
      case 'auth/invalid-email':
        return 'Неверный формат адреса электронной почты. Проверьте, чтобы в названии была собачка (@), домен (например, .com, .ru) и не было пробелов.';
      case 'auth/weak-password':
        return 'Слишком простой или короткий пароль! Ради безопасности вашего профиля, пароль должен состоять как минимум из 6 символов.';
      case 'auth/user-not-found':
        return 'Пользователь с такой электронной почтой не зарегистрирован. Проверьте правильность написания адреса или переключитесь на вкладку регистрации.';
      case 'auth/wrong-password':
        return 'Неверно указан пароль. Пожалуйста, убедитесь, что вводите правильный пароль, у вас включена нужная языковая раскладка и Caps Lock отключен.';
      case 'auth/invalid-credential':
        return 'Неверный логин или пароль. Пожалуйста, проверьте правильность ввода почты и пароля, раскладку клавиатуры и статус клавиши Caps Lock.';
      case 'auth/too-many-requests':
        return 'Слишком много неудачных попыток входа! Мы временно заблокировали доступ для вашей защиты. Пожалуйста, подождите 2-3 минуты и попробуйте снова.';
      case 'auth/user-disabled':
        return 'Этот аккаунт заблокирован или деактивирован администрацией проекта.';
      case 'auth/network-request-failed':
        return 'Проблема с интернет-соединением. Не удалось связаться с серверами авторизации. Проверьте ваше подключение к сети и попробуйте заново.';
      case 'auth/operation-not-allowed':
        return 'Вход по связке почта/пароль на данный момент временно отключен администратором.';
      default:
        // Try searching common keywords in error message
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('already-in-use') || lowerMsg.includes('already registered') || lowerMsg.includes('email-already-in-use')) {
          return 'Этот E-mail уже используется другим пользователем.';
        }
        if (lowerMsg.includes('wrong-password') || lowerMsg.includes('invalid-credential') || lowerMsg.includes('wrong password')) {
          return 'Неверные данные входа. Проверьте правильность написания почты, пароля, раскладки клавиатуры и Caps Lock.';
        }
        if (lowerMsg.includes('weak-password') || lowerMsg.includes('weak password')) {
          return 'Указан слишком слабый пароль. Сделайте его длиннее 6 символов.';
        }
        if (lowerMsg.includes('too-many-requests') || lowerMsg.includes('too many requests')) {
          return 'Превышен лимит попыток. Пожалуйста, подождите несколько минут перед следующей попыткой.';
        }
        return `Произошла ошибка при обработке запроса: ${message || 'Неизвестная ошибка'}. Убедитесь, что все поля заполнены корректно и попробуйте заново.`;
    }
  } else {
    // English
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. If this is your account, please sign in or use password recovery.';
      case 'auth/invalid-email':
        return 'Invalid email address format. Please check for typos, missing "@" symbol, domain (like .com), or accidental spaces.';
      case 'auth/weak-password':
        return 'Your password is too weak! For security reasons, please create a password with at least 6 characters.';
      case 'auth/user-not-found':
        return 'No user found with this email. Please verify your spelling or switch to the sign-up tab to register.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your Caps Lock, language layout, and try typing it slowly.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please double-check your spelling, keyboard layout, and ensure Caps Lock is off.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts! Access is temporarily disabled to secure your account. Please wait a couple minutes and try again.';
      case 'auth/user-disabled':
        return 'This user account has been suspended or disabled by project administration.';
      case 'auth/network-request-failed':
        return 'Network issue. Failed to connect to the authorization servers. Please check your internet connection and try again.';
      default:
        return `An error occurred during authentication: ${message || 'Unknown error'}. Please verify fields and try again.`;
    }
  }
}
