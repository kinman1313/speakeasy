const userService = require('../../src/services/userService');
const User = require('../../src/models/User');

describe('UserService', () => {
    const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
    };

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const result = await userService.register(mockUser);

            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.verificationToken).toBeDefined();
            expect(result.user.username).toBe(mockUser.username);
            expect(result.user.email).toBe(mockUser.email);
            expect(result.user.isVerified).toBe(false);
        });

        it('should not register a user with existing email', async () => {
            await userService.register(mockUser);

            await expect(userService.register(mockUser)).rejects.toThrow('User already exists');
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            await userService.register(mockUser);
        });

        it('should login successfully with correct credentials', async () => {
            const result = await userService.login(mockUser.email, mockUser.password);

            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.email).toBe(mockUser.email);
        });

        it('should not login with incorrect password', async () => {
            await expect(userService.login(mockUser.email, 'wrongpassword')).rejects.toThrow('Invalid credentials');
        });

        it('should not login with non-existent email', async () => {
            await expect(userService.login('nonexistent@example.com', mockUser.password)).rejects.toThrow(
                'Invalid credentials'
            );
        });
    });

    describe('verifyEmail', () => {
        let verificationToken;

        beforeEach(async () => {
            const result = await userService.register(mockUser);
            verificationToken = result.verificationToken;
        });

        it('should verify email with valid token', async () => {
            const user = await userService.verifyEmail(verificationToken);

            expect(user.isVerified).toBe(true);
            expect(user.verificationToken).toBeUndefined();
            expect(user.verificationTokenExpires).toBeUndefined();
        });

        it('should not verify email with invalid token', async () => {
            await expect(userService.verifyEmail('invalidtoken')).rejects.toThrow('Invalid or expired token');
        });
    });

    describe('requestPasswordReset', () => {
        beforeEach(async () => {
            await userService.register(mockUser);
        });

        it('should generate reset token for existing user', async () => {
            const resetToken = await userService.requestPasswordReset(mockUser.email);

            expect(resetToken).toBeDefined();
            const user = await User.findOne({ email: mockUser.email });
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpires).toBeDefined();
        });

        it('should throw error for non-existent user', async () => {
            await expect(userService.requestPasswordReset('nonexistent@example.com')).rejects.toThrow('User not found');
        });
    });

    describe('resetPassword', () => {
        let resetToken;

        beforeEach(async () => {
            await userService.register(mockUser);
            resetToken = await userService.requestPasswordReset(mockUser.email);
        });

        it('should reset password with valid token', async () => {
            const newPassword = 'NewTest123!@#';
            const user = await userService.resetPassword(resetToken, newPassword);

            expect(user.resetPasswordToken).toBeUndefined();
            expect(user.resetPasswordExpires).toBeUndefined();

            // Should be able to login with new password
            const loginResult = await userService.login(mockUser.email, newPassword);
            expect(loginResult.user).toBeDefined();
        });

        it('should not reset password with invalid token', async () => {
            await expect(userService.resetPassword('invalidtoken', 'newpassword')).rejects.toThrow(
                'Invalid or expired token'
            );
        });
    });

    describe('updateProfile', () => {
        let userId;

        beforeEach(async () => {
            const result = await userService.register(mockUser);
            userId = result.user._id;
        });

        it('should update user profile', async () => {
            const updates = {
                username: 'newusername',
                bio: 'New bio'
            };

            const user = await userService.updateProfile(userId, updates);

            expect(user.username).toBe(updates.username);
            expect(user.bio).toBe(updates.bio);
        });

        it('should not update with invalid user id', async () => {
            await expect(userService.updateProfile('invalidid', { username: 'newname' })).rejects.toThrow('User not found');
        });
    });
}); 