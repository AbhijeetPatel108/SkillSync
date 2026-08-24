
module.exports = {

  
  JWT_EXPIRES_IN: '7d',      

  
  
  
  BCRYPT_SALT_ROUNDS: 12,

  
  DEFAULT_PAGE:      1,
  DEFAULT_LIMIT:     10,
  MAX_LIMIT:         50,

  
  
  
  SKILL_CATEGORIES: [
    'Technology',
    'Design',
    'Music',
    'Language',
    'Cooking',
    'Fitness',
    'Business',
    'Art',
    'Writing',
    'Other',
  ],

  
  SKILL_LEVELS: ['Beginner', 'Intermediate', 'Expert'],

  
  MATCH_STATUS: {
    PENDING:   'pending',
    ACCEPTED:  'accepted',
    REJECTED:  'rejected',
    CANCELLED: 'cancelled',
  },

  
  USER_ROLES: {
    USER:  'user',
    ADMIN: 'admin',
  },

  

  
  
  
  MESSAGE_MAX_LENGTH: 1000,

  
  
  
  
  
  
  
  
  CHAT_EVENTS: {
    
    JOIN_ROOM:           'join_room',
    SEND_MESSAGE:        'send_message',
    TYPING_START:        'typing_start',
    TYPING_STOP:         'typing_stop',
    MARK_READ:           'mark_read',

    
    ROOM_JOINED:         'room_joined',
    NEW_MESSAGE:         'new_message',
    USER_TYPING:         'user_typing',
    USER_STOPPED_TYPING: 'user_stopped_typing',
    USER_ONLINE:         'user_online',
    USER_OFFLINE:        'user_offline',
    CONNECTED:           'connected',
    ERROR:               'error',
  },
};
