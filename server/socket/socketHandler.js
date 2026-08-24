
const Match   = require('../models/Match');
const Message = require('../models/Message');
const { MATCH_STATUS, CHAT_EVENTS, MESSAGE_MAX_LENGTH } = require('../config/constants');

const onlineUsers = new Map();

// ─── Room name helper ─────────────────────────────────────────────────────────
// Centralise room naming so it's consistent everywhere in this file.
const roomName = (matchId) => `chat:${matchId}`;

// ─── initSocketHandler ────────────────────────────────────────────────────────
/**
 * Registers all event listeners on the Socket.IO server.
 * Called once in index.js after the Socket.IO server is created.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
const initSocketHandler = (io) => {

  // socketAuth middleware already ran — socket.user is guaranteed to be set.
  io.on('connection', (socket) => {
    const userId   = socket.user.id.toString();
    const userName = socket.user.name;

    // ── Register in online map ───────────────────────────────────────────────
    onlineUsers.set(userId, socket.id);

    console.log(`🟢 [Socket] Connected: ${userName} (${userId})`);

    // Notify the connecting user of who is currently online.
    // Only send back IDs — the client already has name/avatar from the REST API.
    socket.emit(CHAT_EVENTS.CONNECTED, {
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    // Broadcast to everyone else that this user came online.
    socket.broadcast.emit(CHAT_EVENTS.USER_ONLINE, { userId });
    socket.on(CHAT_EVENTS.JOIN_ROOM, async ({ matchId } = {}) => {
      try {
        if (!matchId) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'matchId is required' });
        }

        // Verify the match exists and is accepted
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit(CHAT_EVENTS.ERROR, { message: 'Match not found' });
        }
        if (match.status !== MATCH_STATUS.ACCEPTED) {
          return socket.emit(CHAT_EVENTS.ERROR, {
            message: 'Chat is only available for accepted matches',
          });
        }

        // Verify the user is a participant
        const isSender   = match.sender.toString()   === userId;
        const isReceiver = match.receiver.toString() === userId;
        if (!isSender && !isReceiver) {
          return socket.emit(CHAT_EVENTS.ERROR, {
            message: 'You are not a participant in this match',
          });
        }

        // Join the Socket.IO room
        const room = roomName(matchId);
        socket.join(room);

        // Fetch the last 20 messages as initial history.
        // The REST endpoint /api/chat/rooms/:matchId/messages handles full
        // paginated history — this is just the "quick load" for the chat window.
        const recentMessages = await Message.find({ match: matchId })
          .populate('sender', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(); // .lean() returns plain JS objects — faster, no Mongoose overhead

        // Reverse so oldest is first (natural chat order: top = old, bottom = new)
        recentMessages.reverse();

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
        // ── Validate inputs ─────────────────────────────────────────────────
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

        // ── Re-verify participation before saving ──────────────────────────
        // A user could theoretically join a room, then have their match
        // cancelled (edge case), and still try to send. We check on every
        // message — the DB hit is minimal (indexed lookup).
        const match = await Match.findById(matchId);
        if (!match || match.status !== MATCH_STATUS.ACCEPTED) {
          return socket.emit(CHAT_EVENTS.ERROR, {
            message: 'Cannot send message: match is no longer active',
          });
        }

        const isSender   = match.sender.toString()   === userId;
        const isReceiver = match.receiver.toString() === userId;
        if (!isSender && !isReceiver) {
          return socket.emit(CHAT_EVENTS.ERROR, {
            message: 'You are not a participant in this match',
          });
        }

        // ── Persist to MongoDB ──────────────────────────────────────────────
        // Sender is added to readBy immediately — they read their own message.
        const message = await Message.create({
          match:   matchId,
          sender:  userId,
          content: content.trim(),
          readBy:  [userId],
        });

        // Populate sender for broadcast — clients need name + avatar to render
        await message.populate('sender', 'name avatar');

        // ── Broadcast to the entire room ────────────────────────────────────
        // io.to(room).emit sends to ALL sockets in the room including the sender.
        // This is intentional: the sender's UI replaces its optimistic message
        // with the server-confirmed one (with real id + createdAt).
        const room = roomName(matchId);
        io.to(room).emit(CHAT_EVENTS.NEW_MESSAGE, { message });

        console.log(`💬 [Socket] Message in ${room} from ${userName}: "${content.trim().substring(0, 30)}..."`);

      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit(CHAT_EVENTS.ERROR, { message: 'Failed to send message' });
      }
    });

    // ── typing_start ─────────────────────────────────────────────────────────
    // Client sends:  { matchId: string }
    // Server broadcasts to the OTHER user in the room (not the sender).
    // Uses socket.to(room) — excludes the sender's own socket.
    socket.on(CHAT_EVENTS.TYPING_START, ({ matchId } = {}) => {
      if (!matchId) return;
      const room = roomName(matchId);
      socket.to(room).emit(CHAT_EVENTS.USER_TYPING, {
        matchId,
        userId,
        name: userName,
      });
    });

    // ── typing_stop ───────────────────────────────────────────────────────────
    // Client sends:  { matchId: string }
    // Mirror of typing_start — tells the other user to hide the indicator.
    socket.on(CHAT_EVENTS.TYPING_STOP, ({ matchId } = {}) => {
      if (!matchId) return;
      const room = roomName(matchId);
      socket.to(room).emit(CHAT_EVENTS.USER_STOPPED_TYPING, {
        matchId,
        userId,
      });
    });

    // ── mark_read ─────────────────────────────────────────────────────────────
    // Client sends:  { matchId: string }
    // Adds the current user to readBy on all messages in this conversation
    // that they haven't read yet. Fire-and-forget — no ack needed.
    //
    // $addToSet prevents duplicates (same as the REST endpoint's logic).
    socket.on(CHAT_EVENTS.MARK_READ, async ({ matchId } = {}) => {
      try {
        if (!matchId) return;

        await Message.updateMany(
          {
            match:  matchId,
            readBy: { $ne: userId },  // only messages not yet read by this user
          },
          {
            $addToSet: { readBy: userId },
          }
        );

      } catch (err) {
        // mark_read is fire-and-forget — log but don't disrupt the user
        console.error('[Socket] mark_read error:', err.message);
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    // Fires automatically when the socket closes (tab close, network loss, etc.)
    // Remove from online map, broadcast offline status to everyone.
    socket.on('disconnect', (reason) => {
      onlineUsers.delete(userId);
      console.log(`🔴 [Socket] Disconnected: ${userName} (${userId}) — ${reason}`);

      // Broadcast to all other connected clients
      socket.broadcast.emit(CHAT_EVENTS.USER_OFFLINE, { userId });
    });

  }); // end io.on('connection')

}; // end initSocketHandler

module.exports = { initSocketHandler };
