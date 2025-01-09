const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
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
    identityKey: String,
    signedPreKey: Object,
    oneTimePreKeys: [Object],
    registrationId: String
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

userSchema.methods = {
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
    },

    async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    },

    generateAuthToken() {
        return jwt.sign(
            { id: this._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
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
    }
};

// Create indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 