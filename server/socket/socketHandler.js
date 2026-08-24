const { pool } = require('../config/db');
const { MATCH_STATUS, CHAT_EVENTS, MESSAGE_MAX_LENGTH } = require('../config/constants');

const onlineUsers = new Map();
const roomName = (matchId) => `chat:${matchId}`;

const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    const userId = String(socket.user.id);
    const userName = socket.user.name;

    onlineUsers.set(userId, socket.id);
    console.log(`🟢 [Socket] Connected: ${userName} (${userId})`);

    socket.emit(CHAT_EVENTS.CONNECTED, {
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    socket.broadcast.emit(CHAT_EVENTS.USER_ONLINE, { userId });

    socket.on(CHAT_EVENTS.JOIN_ROOM, async ({ matchId } = {}) => {
      try {
        if (!matchId) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'matchId is required' });
        }

        const [matchRows] = await pool.execute(
          'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
          [matchId]
        );
        const match = matchRows[0];

        if (!match) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'Match not found' });
        }
        if (match.status !== MATCH_STATUS.ACCEPTED) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'Chat is only available for accepted matches' });
        }

        const isSender = Number(match.sender_id) === Number(userId);
        const isReceiver = Number(match.receiver_id) === Number(userId);
        if (!isSender && !isReceiver) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'You are not a participant in this match' });
        }

        const room = roomName(matchId);
        socket.join(room);

        const [recentRows] = await pool.execute(
          `SELECT m.id, m.match_id, m.content, m.created_at,
                  u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.match_id = ?
           ORDER BY m.created_at DESC LIMIT 20`,
          [matchId]
        );

        const recentMessages = recentRows
          .map((row) => ({
            id: Number(row.id),
            match: Number(row.match_id),
            content: row.content,
            createdAt: row.created_at,
            sender: {
              id: Number(row.sender_id),
              name: row.sender_name,
              avatar: row.sender_avatar || '',
            },
          }))
          .reverse();

        socket.emit(CHAT_EVENTS.ROOM_JOINED, {
          matchId,
          messages: recentMessages,
        });

        console.log(`📬 [Socket] ${userName} joined room ${room}`);
      } catch (err) {
        console.error('[Socket] join_room error:', err.message);
        socket.emit(CHAT_EVENTS.ERROR, { message: 'Failed to join room' });
      }
    });

    socket.on(CHAT_EVENTS.SEND_MESSAGE, async ({ matchId, content } = {}) => {
      try {
        if (!matchId) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'matchId is required' });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'Message content is required' });
        }
        if (content.trim().length > MESSAGE_MAX_LENGTH) {
          return socket.emit(CHAT_EVENTS.ERROR, {
            message: `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`,
          });
        }

        const [matchRows] = await pool.execute(
          'SELECT id, sender_id, receiver_id, status FROM matches WHERE id = ? LIMIT 1',
          [matchId]
        );
        const match = matchRows[0];
        if (!match || match.status !== MATCH_STATUS.ACCEPTED) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'Cannot send message: match is no longer active' });
        }

        const isSender = Number(match.sender_id) === Number(userId);
        const isReceiver = Number(match.receiver_id) === Number(userId);
        if (!isSender && !isReceiver) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'You are not a participant in this match' });
        }

        const trimmed = content.trim();
        const [result] = await pool.execute(
          'INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)',
          [matchId, userId, trimmed]
        );

        const [messageRows] = await pool.execute(
          `SELECT m.id, m.match_id, m.content, m.created_at,
                  u.id AS sender_id, u.name AS sender_name, u.avatar AS sender_avatar
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.id = ? LIMIT 1`,
          [result.insertId]
        );

        const message = messageRows[0] ? {
          id: Number(messageRows[0].id),
          match: Number(messageRows[0].match_id),
          content: messageRows[0].content,
          createdAt: messageRows[0].created_at,
          sender: {
            id: Number(messageRows[0].sender_id),
            name: messageRows[0].sender_name,
            avatar: messageRows[0].sender_avatar || '',
          },
        } : null;

        const room = roomName(matchId);
        io.to(room).emit(CHAT_EVENTS.NEW_MESSAGE, { message });

        await pool.execute(
          `INSERT INTO message_read_by (message_id, user_id)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
          [result.insertId, userId]
        );

        console.log(`💬 [Socket] Message in ${room} from ${userName}: "${trimmed.substring(0, 30)}..."`);
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit(CHAT_EVENTS.ERROR, { message: 'Failed to send message' });
      }
    });

    socket.on(CHAT_EVENTS.TYPING_START, ({ matchId } = {}) => {
      if (!matchId) return;
      const room = roomName(matchId);
      socket.to(room).emit(CHAT_EVENTS.USER_TYPING, { matchId, userId, name: userName });
    });

    socket.on(CHAT_EVENTS.TYPING_STOP, ({ matchId } = {}) => {
      if (!matchId) return;
      const room = roomName(matchId);
      socket.to(room).emit(CHAT_EVENTS.USER_STOPPED_TYPING, { matchId, userId });
    });

    socket.on(CHAT_EVENTS.MARK_READ, async ({ matchId } = {}) => {
      try {
        if (!matchId) return;

        await pool.execute(
          `INSERT INTO message_read_by (message_id, user_id)
           SELECT m.id, ?
           FROM messages m
           WHERE m.match_id = ?
             AND NOT EXISTS (SELECT 1 FROM message_read_by mr WHERE mr.message_id = m.id AND mr.user_id = ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
          [userId, matchId, userId]
        );
      } catch (err) {
        console.error('[Socket] mark_read error:', err.message);
      }
    });

    socket.on('disconnect', (reason) => {
      onlineUsers.delete(userId);
      console.log(`🔴 [Socket] Disconnected: ${userName} (${userId}) — ${reason}`);
      socket.broadcast.emit(CHAT_EVENTS.USER_OFFLINE, { userId });
    });
  });
};

module.exports = { initSocketHandler };
