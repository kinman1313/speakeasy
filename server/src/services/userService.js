import User from '../models/User.js';
import messageEncryptionService from './messageEncryptionService.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class UserService {
    // User registration
    async register(userData) {
        try {
            const { username, email, password } = userData;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                throw new Error('User already exists');
            }

            // Create new user
            const user = new User({
                username,
                email,
                password
            });

            // Generate verification token
            const verificationToken = user.generateVerificationToken();

            // Setup Signal Protocol encryption for the user
            const encryptionKeys = await messageEncryptionService.setupUserEncryption(user._id);

            // Update user with encryption keys
            await user.updateSignalKeys(
                encryptionKeys.identityKey,
                encryptionKeys.preKeyBundle.signedPreKey,
                encryptionKeys.preKeyBundle.preKeys,
                encryptionKeys.preKeyBundle.registrationId
            );

            // Save user
            await user.save();

            // Generate JWT
            const token = user.generateAuthToken();

            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified
                },
                token,
                verificationToken
            };
        } catch (error) {
            logger.error('Error in user registration:', error);
            throw error;
        }
    }

    // User login
    async login(email, password) {
        try {
            // Find user and include password field
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Update last seen
            user.lastSeen = new Date();
            user.status = 'online';
            await user.save();

            // Generate token
            const token = user.generateAuthToken();

            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified,
                    status: user.status
                },
                token
            };
        } catch (error) {
            logger.error('Error in user login:', error);
            throw error;
        }
    }

    // Verify email
    async verifyEmail(token) {
        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                verificationToken: hashedToken,
                verificationTokenExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new Error('Invalid or expired token');
            }

            user.isVerified = true;
            user.verificationToken = undefined;
            user.verificationTokenExpires = undefined;

            await user.save();

            return user;
        } catch (error) {
            logger.error('Error in email verification:', error);
            throw error;
        }
    }

    // Request password reset
    async requestPasswordReset(email) {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                throw new Error('User not found');
            }

            const resetToken = user.generateResetPasswordToken();
            await user.save();

            return resetToken;
        } catch (error) {
            logger.error('Error in password reset request:', error);
            throw error;
        }
    }

    // Reset password
    async resetPassword(token, newPassword) {
        try {
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new Error('Invalid or expired token');
            }

            // Update password
            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            return user;
        } catch (error) {
            logger.error('Error in password reset:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        try {
            const allowedUpdates = ['username', 'bio', 'avatar'];
            const updates = Object.keys(updateData)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updateData[key];
                    return obj;
                }, {});

            const user = await User.findByIdAndUpdate(
                userId,
                updates,
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Error in profile update:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId).select('+password');

            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            await user.save();

            return true;
        } catch (error) {
            logger.error('Error in password change:', error);
            throw error;
        }
    }

    // Get user profile
    async getProfile(userId) {
        try {
            const user = await User.findById(userId)
                .select('-password')
                .populate('friends', 'username avatar status');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Error in getting user profile:', error);
            throw error;
        }
    }

    // Search users
    async searchUsers(query, currentUserId) {
        try {
            const users = await User.find({
                $and: [
                    {
                        $or: [
                            { username: { $regex: query, $options: 'i' } },
                            { email: { $regex: query, $options: 'i' } }
                        ]
                    },
                    { _id: { $ne: currentUserId } }
                ]
            })
                .select('username email avatar status')
                .limit(10);

            return users;
        } catch (error) {
            logger.error('Error in user search:', error);
            throw error;
        }
    }

    // Friend management methods
    async sendFriendRequest(senderId, recipientId) {
        try {
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                throw new Error('Recipient not found');
            }

            if (recipient.friendRequests.includes(senderId)) {
                throw new Error('Friend request already sent');
            }

            recipient.friendRequests.push(senderId);
            await recipient.save();

            return true;
        } catch (error) {
            logger.error('Error in sending friend request:', error);
            throw error;
        }
    }

    async acceptFriendRequest(userId, friendId) {
        try {
            const [user, friend] = await Promise.all([
                User.findById(userId),
                User.findById(friendId)
            ]);

            if (!user || !friend) {
                throw new Error('User or friend not found');
            }

            await Promise.all([
                user.addFriend(friendId),
                friend.addFriend(userId)
            ]);

            return true;
        } catch (error) {
            logger.error('Error in accepting friend request:', error);
            throw error;
        }
    }

    async removeFriend(userId, friendId) {
        try {
            const [user, friend] = await Promise.all([
                User.findById(userId),
                User.findById(friendId)
            ]);

            if (!user || !friend) {
                throw new Error('User or friend not found');
            }

            await Promise.all([
                user.removeFriend(friendId),
                friend.removeFriend(userId)
            ]);

            return true;
        } catch (error) {
            logger.error('Error in removing friend:', error);
            throw error;
        }
    }

    // Block/Unblock users
    async blockUser(userId, blockedUserId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.blockUser(blockedUserId);
            return true;
        } catch (error) {
            logger.error('Error in blocking user:', error);
            throw error;
        }
    }

    async unblockUser(userId, blockedUserId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await user.unblockUser(blockedUserId);
            return true;
        } catch (error) {
            logger.error('Error in unblocking user:', error);
            throw error;
        }
    }
}

export default new UserService(); 