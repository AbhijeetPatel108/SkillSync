

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    
    
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewer is required'],
    },

    
    
    
    reviewee: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewee is required'],
    },

    
    
    
    
    
    match: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Match',
      required: [true, 'Match reference is required'],
    },

    
    
    
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
      
      
    },

    
    
    comment: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
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







reviewSchema.index({ reviewer: 1, match: 1 }, { unique: true });




reviewSchema.index({ reviewee: 1, createdAt: -1 });


reviewSchema.index({ reviewer: 1, createdAt: -1 });



reviewSchema.statics.recalcStats = async function (revieweeId) {
  
  
  
  const stats = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId) } },
    {
      $group: {
        _id:           null,
        averageRating: { $avg: '$rating' },
        totalReviews:  { $sum: 1 },
      },
    },
  ]);

  
  
  const averageRating = stats.length > 0
    ? Math.round(stats[0].averageRating * 10) / 10  
    : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  
  
  
  
  
  const User = require('./User');
  await User.findByIdAndUpdate(revieweeId, {
    $set: { averageRating, totalReviews },
  });
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
