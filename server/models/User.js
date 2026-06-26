/**
 * server/models/User.js
 *
 * The User schema — the contract that every user document in MongoDB must follow.
 *
 * Three things this file does beyond just defining fields:
 *  1. Pre-save hook  → hashes the password automatically before every .save()
 *  2. Instance method → comparePassword() so controllers never touch bcrypt directly
 *  3. toJSON transform → strips _id/__v/password from every API response automatically
 *
 * MVC role: this is the MODEL layer.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS, SKILL_CATEGORIES, SKILL_LEVELS, USER_ROLES } = require('../config/constants');

// ─── Sub-schema: one skill entry ─────────────────────────────────────────────
// Used inside the skillsOffered and skillsWanted arrays.
// Defining it separately keeps the main schema readable.
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
  { _id: false } // no auto-generated _id for each skill sub-document
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
      unique:    true,       // MongoDB creates a unique index on this field
      lowercase: true,       // always stored as lowercase — no case-mismatch issues
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
      // select: false means password is NEVER returned by any query unless
      // you explicitly opt in with .select('+password').
      // This prevents accidentally leaking hashes in API responses.
      select: false,
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
      // Allows "soft delete" — deactivate an account without destroying data.
    },

    lastLogin: {
      type:    Date,
      default: null,
    },
  },
  {
    // timestamps: true automatically manages createdAt and updatedAt.
    // Mongoose updates them on every .save() — you never set them manually.
    timestamps: true,

    // toJSON controls what res.json(user) actually sends over the wire.
    // We use it to:
    //   • rename _id → id  (friendlier for frontend JS)
    //   • remove __v       (Mongoose internal version key — useless to clients)
    //   • remove password  (extra safety net on top of select:false)
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
// Runs automatically before EVERY .save() call.
//
// isModified('password') check is critical:
//   If a user updates only their bio, we must NOT re-hash the
//   already-hashed password string — that would corrupt it.
//   We hash only when the raw password field was actually changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});
// ─── Instance method: comparePassword ────────────────────────────────────────
// Available on every user document:  await user.comparePassword('rawText')
//
// Why define it here instead of in the controller?
//   The model owns its own data logic. Controllers stay thin and readable.
//   bcrypt is never imported outside this file.
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare() hashes candidatePassword the same way and checks equality.
  // We cannot simply compare strings — hashing is one-way.
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email already has a unique index from `unique: true` above.
// These compound indexes speed up the skill-browsing queries in Module 4.
userSchema.index({ 'skillsOffered.category': 1 });
userSchema.index({ 'skillsWanted.category':  1 });
userSchema.index({ location: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
