export const DELAYED_MESSAGE_EXCHANGE_NAME =
  process.env.NODE_ENV === 'production' ? 'post_deletion_exchange' : 'post_deletion_exchange_test';
