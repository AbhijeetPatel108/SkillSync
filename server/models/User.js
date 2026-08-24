

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS, SKILL_CATEGORIES, SKILL_LEVELS, USER_ROLES } = require('../config/constants');


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


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    BCRYPT_SALT_ROUNDS
  );
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.index({ 'skillsOffered.category': 1 });
userSchema.index({ 'skillsWanted.category':  1 });
userSchema.index({ location: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
