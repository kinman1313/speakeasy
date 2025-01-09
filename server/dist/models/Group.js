"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Group = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
const groupSchema = new _mongoose.default.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters long'],
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: 'default-group-avatar.png'
  },
  creator: {
    type: _mongoose.default.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: _mongoose.default.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: _mongoose.default.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    // Signal Protocol related fields for group messaging
    identityKey: String,
    signedPreKey: String,
    oneTimePreKey: String
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanAddMembers: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanRemoveMembers: {
      type: Boolean,
      default: true
    },
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      timer: {
        type: Number,
        default: 0 // 0 means disabled, otherwise time in seconds
      }
    }
  },
  // Signal Protocol group session
  groupSession: {
    type: {
      chainKey: String,
      messageKeys: [{
        index: Number,
        key: String
      }]
    },
    select: false
  },
  // For invite links
  inviteLink: {
    code: String,
    expiresAt: Date,
    maxUses: Number,
    uses: {
      type: Number,
      default: 0
    }
  },
  // For message retention
  messageRetention: {
    type: Number,
    default: 30,
    // Days to keep messages
    min: 1,
    max: 365
  },
  // Metadata
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({
  name: 'text',
  description: 'text'
});
groupSchema.index({
  'inviteLink.code': 1
});
groupSchema.index({
  createdAt: 1
});
groupSchema.index({
  'metadata.lastActivity': 1
});

// Pre-save middleware to ensure creator is admin
groupSchema.pre('save', function (next) {
  if (this.isNew) {
    this.admins = [this.creator];
    this.members.push({
      user: this.creator,
      role: 'admin',
      joinedAt: new Date()
    });
  }
  next();
});

// Methods

// Add member to group
groupSchema.methods.addMember = async function (userId, role = 'member') {
  if (!this.members.some(member => member.user.toString() === userId.toString())) {
    this.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
    if (role === 'admin') {
      this.admins.push(userId);
    }
    await this.save();
  }
};

// Remove member from group
groupSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  this.admins = this.admins.filter(admin => admin.toString() !== userId.toString());
  await this.save();
};

// Change member role
groupSchema.methods.changeMemberRole = async function (userId, newRole) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  if (member) {
    member.role = newRole;
    if (newRole === 'admin') {
      if (!this.admins.includes(userId)) {
        this.admins.push(userId);
      }
    } else {
      this.admins = this.admins.filter(admin => admin.toString() !== userId.toString());
    }
    await this.save();
  }
};

// Generate invite link
groupSchema.methods.generateInviteLink = async function (maxUses = 100, expiresIn = 24) {
  const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  this.inviteLink = {
    code,
    expiresAt: new Date(Date.now() + expiresIn * 60 * 60 * 1000),
    // Convert hours to milliseconds
    maxUses,
    uses: 0
  };
  await this.save();
  return code;
};

// Use invite link
groupSchema.methods.useInviteLink = async function (code) {
  if (this.inviteLink && this.inviteLink.code === code && this.inviteLink.expiresAt > Date.now() && this.inviteLink.uses < this.inviteLink.maxUses) {
    this.inviteLink.uses += 1;
    await this.save();
    return true;
  }
  return false;
};

// Update group session
groupSchema.methods.updateGroupSession = async function (chainKey, messageKeys) {
  this.groupSession = {
    chainKey,
    messageKeys
  };
  await this.save();
};

// Static methods

// Find active groups
groupSchema.statics.findActive = async function (days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({
    'metadata.lastActivity': {
      $gte: date
    }
  }).sort({
    'metadata.lastActivity': -1
  });
};
const Group = exports.Group = _mongoose.default.model('Group', groupSchema);