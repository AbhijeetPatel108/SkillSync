
const mongoose           = require('mongoose');
const { MESSAGE_MAX_LENGTH } = require('../config/constants');

const messageSchema = new mongoose.Schema(
  {
    
    
    
    
    match: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match reference is required'],
    },

    
    
    
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },

    
    
    
    
    content: {
      type:      String,
      required:  [true, 'Message content is required'],
      trim:      true,
      maxlength: [MESSAGE_MAX_LENGTH, `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`],
    },

    
    
    
    
    
    
    
    
    
    readBy: {
      type:    [mongoose.Schema.Types.ObjectId],
      ref:     'User',
      default: [],
    },
  },
  {
    timestamps: true, 

    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);





messageSchema.index({ match: 1, createdAt: -1 });



messageSchema.index({ match: 1, readBy: 1 });


messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
