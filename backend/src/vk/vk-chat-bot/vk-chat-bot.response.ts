export const VK_CHAT_BOT_RESPONSES = Object.freeze({
  COMMANDS: {
    help: (maxDuration: number) => {
      return (
        'ГИФКОБОТ\n\nДоступны варианты конвертации видео → .gif\n' +
        '• Youtube: /gif и ссылка на видос на ютубе\n' +
        '• VK видео: отправляй видос из добавленных в ВК (не забудь убедится, что видос общедоступен в настройках приватности)\n' +
        '• Обычная ссылка: прямая ссылка на видос в любом облачном хранилище\n\n' +
        `• Пока что есть ограничение по длительности в ${maxDuration} секунд\n\n` +
        'Примеры использования:\n' +
        '• /gif https://www.youtube.com/watch?v=Q6SG0qbkIa4\n' +
        '• /gif https://webm.rule34.xxx//images/4135/f0e00ad7834de97d5a460c145a81ace4.mp4?10242792\n' +
        '<<просто видос ВК, без /gif>> (я не знаю как это текстом написать, лол)'
      );
    },
  },
});