import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// Instance methods
userSchema.methods = {
    async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    },

    generateAuthToken() {
        return jwt.sign(
            { id: this._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    },

    generateVerificationToken() {
        const token = crypto.randomBytes(32).toString('hex');
        this.verificationToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        return token;
    },

    generateResetPasswordToken() {
        const token = crypto.randomBytes(32).toString('hex');
        this.resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
        return token;
    },

    async updateSignalKeys(identityKey, signedPreKey, oneTimePreKeys, registrationId) {
        this.identityKey = identityKey;
        this.signedPreKey = signedPreKey;
        this.oneTimePreKeys = oneTimePreKeys;
        this.registrationId = registrationId;
        await this.save();
    },

    getOneTimePreKey() {
        if (this.oneTimePreKeys.length === 0) {
            return null;
        }
        const preKey = this.oneTimePreKeys[0];
        this.oneTimePreKeys = this.oneTimePreKeys.slice(1);
        return preKey;
    },

    async addFriend(friendId) {
        if (!this.friends.includes(friendId)) {
            this.friends.push(friendId);
            this.friendRequests = this.friendRequests.filter(id => id.toString() !== friendId.toString());
            await this.save();
        }
    },

    async removeFriend(friendId) {
        this.friends = this.friends.filter(id => id.toString() !== friendId.toString());
        await this.save();
    },

    async blockUser(userId) {
        if (!this.blockedUsers.includes(userId)) {
            this.blockedUsers.push(userId);
            this.friends = this.friends.filter(id => id.toString() !== userId.toString());
            this.friendRequests = this.friendRequests.filter(id => id.toString() !== userId.toString());
            await this.save();
        }
    },

    async unblockUser(userId) {
        this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
        await this.save();
    }
};

// Create indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });

export const User = mongoose.model('User', userSchema); 