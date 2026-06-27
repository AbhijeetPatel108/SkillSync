/**
 * server/models/User.js
 *
 * MODULE 6 CHANGE — two new fields added to the schema:
 *   averageRating  {Number}  — recomputed by Review.recalcStats() after each review
 *   totalReviews   {Number}  — recomputed by Review.recalcStats() after each review
 *
 * Everything else is identical to the Module 2 version.
 * No hooks, methods, or indexes were changed.
 *
 * Why store these on User instead of computing them on every request?
 *   Computing average rating requires a MongoDB aggregation over the reviews
 *   collection every time a profile is loaded — expensive as reviews grow.
 *   Storing the pre-computed value means any profile fetch is a single
 *   document read. The trade-off is that we must update these values
 *   whenever a review is created or deleted (Review.recalcStats handles this).
 *   This is the standard "denormalization for read performance" pattern.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS, SKILL_CATEGORIES, SKILL_LEVELS, USER_ROLES } = require('../config/constants');

// ─── Sub-schema: one skill entry ─────────────────────────────────────────────
const skillSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Skill name is required'],
      trim:      true,
      maxlength: [50, 'Skill name cannot exceed 50 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Skill category is required'],
      enum: {
        values:  SKILL_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    level: {
      type:    String,
      enum: {
        values:  SKILL_LEVELS,
        message: '{VALUE} is not a valid level',
      },
      default: 'Beginner',
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default:   '',
    },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },

    avatar: {
      type:    String,
      default: '',
    },

    bio: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default:   '',
    },

    location: {
      type:      String,
      trim:      true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default:   '',
    },

    skillsOffered: {
      type:     [skillSchema],
      default:  [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message:   'You can offer a maximum of 10 skills',
      },
    },

    skillsWanted: {
      type:     [skillSchema],
      default:  [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message:   'You can list a maximum of 10 wanted skills',
      },
    },

    role: {
      type:    String,
      enum:    Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    lastLogin: {
      type:    Date,
      default: null,
    },

    // ── MODULE 6 ADDITIONS ─────────────────────────────────────────────────
    // Both fields are managed exclusively by Review.recalcStats().
    // Controllers must NEVER update these directly — always go through recalcStats.
    // default: 0 means new users show "No reviews yet" until their first review.

    averageRating: {
      type:    Number,
      default: 0,
      min:     [0, 'Average rating cannot be negative'],
      max:     [5, 'Average rating cannot exceed 5'],
    },

    totalReviews: {
      type:    Number,
      default: 0,
      min:     [0, 'Total reviews cannot be negative'],
    },
    // ── END MODULE 6 ADDITIONS ─────────────────────────────────────────────
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// ─── Pre-save hook: hash password ────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    BCRYPT_SALT_ROUNDS
  );
});
// ─── Instance method: comparePassword ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ 'skillsOffered.category': 1 });
userSchema.index({ 'skillsWanted.category':  1 });
userSchema.index({ location: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
