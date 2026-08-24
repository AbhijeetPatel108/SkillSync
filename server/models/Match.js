

const mongoose  = require('mongoose');
const { MATCH_STATUS } = require('../config/constants');

const matchSchema = new mongoose.Schema(
  {
    
    
    
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },

    
    
    receiver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Receiver is required'],
    },

    
    
    
    
    
    
    
    
    
    
    status: {
      type:    String,
      enum: {
        values:  Object.values(MATCH_STATUS),
        message: '{VALUE} is not a valid match status',
      },
      default: MATCH_STATUS.PENDING,
    },

    
    
    
    message: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
      default:   '',
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















matchSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { unique: true }
);





matchSchema.index({ sender:   1, status: 1 });
matchSchema.index({ receiver: 1, status: 1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
