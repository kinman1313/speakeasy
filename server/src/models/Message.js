const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'video'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    // Signal Protocol encryption fields
    encryptedContent: {
        type: String,
        required: true,
        select: false // Don't include in regular queries
    },
    encryptionType: {
        type: String,
        enum: ['signal'],
        default: 'signal'
    },
    // Message state
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    readAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    // For disappearing messages
    expiresAt: {
        type: Date
    },
    // For edited messages
    isEdited: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedAt: Date
    }],
    // For replies and threads
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    // For group messages
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    // For reactions
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // For attachments
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'file']
        },
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number, // For audio/video
        thumbnail: String // For images/videos
    }],
    // Metadata
    metadata: {
        clientMessageId: String, // For message ordering and deduplication
        deviceId: Number,
        sessionId: String // Signal Protocol session ID
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ group: 1 });
messageSchema.index({ createdAt: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for disappearing messages

// Pre-save middleware to handle message expiration
messageSchema.pre('save', function (next) {
    if (this.expiresAt && this.expiresAt <= new Date()) {
        // Don't save expired messages
        const error = new Error('Message has expired');
        error.name = 'MessageExpiredError';
        return next(error);
    }
    next();
});

// Methods for message status updates
messageSchema.methods.markAsDelivered = async function () {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    await this.save();
};

messageSchema.methods.markAsRead = async function () {
    this.status = 'read';
    this.readAt = new Date();
    await this.save();
};

// Method for editing messages
messageSchema.methods.edit = async function (newContent) {
    if (this.isEdited) {
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
    } else {
        this.isEdited = true;
    }
    this.content = newContent;
    await this.save();
};

// Method for adding reactions
messageSchema.methods.addReaction = async function (userId, reactionType) {
    const existingReaction = this.reactions.find(
        reaction => reaction.user.toString() === userId.toString()
    );

    if (existingReaction) {
        existingReaction.type = reactionType;
        existingReaction.createdAt = new Date();
    } else {
        this.reactions.push({
            user: userId,
            type: reactionType
        });
    }

    await this.save();
};

// Method for removing reactions
messageSchema.methods.removeReaction = async function (userId) {
    this.reactions = this.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
    );
    await this.save();
};

// Static method to get messages between users
messageSchema.statics.getMessagesBetweenUsers = async function (user1Id, user2Id, options = {}) {
    const query = {
        $or: [
            { sender: user1Id, recipient: user2Id },
            { sender: user2Id, recipient: user1Id }
        ]
    };

    if (options.after) {
        query.createdAt = { $gt: options.after };
    }

    if (options.before) {
        query.createdAt = { ...query.createdAt, $lt: options.before };
    }

    const messages = await this.find(query)
        .sort({ createdAt: options.sort || -1 })
        .limit(options.limit || 50)
        .populate('sender', 'username avatar')
        .populate('recipient', 'username avatar')
        .populate('replyTo')
        .lean();

    return messages;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 