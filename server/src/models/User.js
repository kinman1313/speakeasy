const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot exceed 200 characters'],
        default: ''
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Signal Protocol related fields
    identityKey: {
        type: String,
        select: false
    },
    signedPreKey: {
        type: String,
        select: false
    },
    oneTimePreKeys: [{
        keyId: Number,
        key: String
    }],
    registrationId: {
        type: Number,
        select: false
    },
    deviceId: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Generate verification token
userSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');

    this.verificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return token;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function () {
    const token = crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    return token;
};

// Method to update Signal Protocol keys
userSchema.methods.updateSignalKeys = async function (identityKey, signedPreKey, oneTimePreKeys, registrationId) {
    this.identityKey = identityKey;
    this.signedPreKey = signedPreKey;
    this.oneTimePreKeys = oneTimePreKeys;
    this.registrationId = registrationId;
    await this.save();
};

// Method to get one-time pre-key
userSchema.methods.getOneTimePreKey = function () {
    if (this.oneTimePreKeys.length === 0) {
        return null;
    }

    const preKey = this.oneTimePreKeys[0];
    this.oneTimePreKeys = this.oneTimePreKeys.slice(1);
    return preKey;
};

// Method to add friend
userSchema.methods.addFriend = async function (friendId) {
    if (!this.friends.includes(friendId)) {
        this.friends.push(friendId);
        this.friendRequests = this.friendRequests.filter(id => id.toString() !== friendId.toString());
        await this.save();
    }
};

// Method to remove friend
userSchema.methods.removeFriend = async function (friendId) {
    this.friends = this.friends.filter(id => id.toString() !== friendId.toString());
    await this.save();
};

// Method to block user
userSchema.methods.blockUser = async function (userId) {
    if (!this.blockedUsers.includes(userId)) {
        this.blockedUsers.push(userId);
        this.friends = this.friends.filter(id => id.toString() !== userId.toString());
        this.friendRequests = this.friendRequests.filter(id => id.toString() !== userId.toString());
        await this.save();
    }
};

// Method to unblock user
userSchema.methods.unblockUser = async function (userId) {
    this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
    await this.save();
};

// Create indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 