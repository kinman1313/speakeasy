"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Group = require("../models/Group.js");
var _User = require("../models/User.js");
var _messageEncryptionService = _interopRequireDefault(require("./messageEncryptionService.js"));
var _logger = _interopRequireDefault(require("../utils/logger.js"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2.default)(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
class GroupService {
  // Create new group
  async createGroup(creatorId, groupData) {
    try {
      const creator = await _User.User.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }
      const group = new _Group.Group({
        name: groupData.name,
        description: groupData.description,
        creator: creatorId,
        settings: _objectSpread(_objectSpread({}, groupData.settings), {}, {
          isPrivate: groupData.isPrivate || false
        })
      });

      // Setup group encryption
      const groupSession = await _messageEncryptionService.default.setupGroupSession(group._id, [creatorId]);
      group.groupSession = groupSession;

      // Add creator as admin
      await group.save();
      return group;
    } catch (error) {
      _logger.default.error('Error in creating group:', error);
      throw error;
    }
  }

  // Get group details
  async getGroup(groupId, userId) {
    try {
      const group = await _Group.Group.findById(groupId).populate('creator', 'username avatar').populate('members.user', 'username avatar status').populate('admins', 'username avatar');
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is member
      if (!group.members.some(member => member.user._id.toString() === userId.toString())) {
        throw new Error('Not authorized to view this group');
      }
      return group;
    } catch (error) {
      _logger.default.error('Error in getting group:', error);
      throw error;
    }
  }

  // Update group
  async updateGroup(groupId, userId, updateData) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is admin
      if (!group.admins.includes(userId)) {
        throw new Error('Not authorized to update this group');
      }
      const allowedUpdates = ['name', 'description', 'settings'];
      const updates = Object.keys(updateData).filter(key => allowedUpdates.includes(key)).reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
      Object.assign(group, updates);
      await group.save();
      return group;
    } catch (error) {
      _logger.default.error('Error in updating group:', error);
      throw error;
    }
  }

  // Add member to group
  async addMember(groupId, adminId, userId) {
    try {
      const [group, user] = await Promise.all([_Group.Group.findById(groupId), _User.User.findById(userId)]);
      if (!group || !user) {
        throw new Error('Group or user not found');
      }

      // Check if admin is authorized
      if (!group.admins.includes(adminId)) {
        throw new Error('Not authorized to add members');
      }

      // Check if user is already a member
      if (group.members.some(member => member.user.toString() === userId.toString())) {
        throw new Error('User is already a member');
      }

      // Setup encryption for new member
      await _messageEncryptionService.default.setupGroupSession(group._id, [...group.members.map(m => m.user.toString()), userId]);

      // Add member
      await group.addMember(userId);
      return group;
    } catch (error) {
      _logger.default.error('Error in adding group member:', error);
      throw error;
    }
  }

  // Remove member from group
  async removeMember(groupId, adminId, userId) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if admin is authorized
      if (!group.admins.includes(adminId)) {
        throw new Error('Not authorized to remove members');
      }

      // Cannot remove creator
      if (group.creator.toString() === userId.toString()) {
        throw new Error('Cannot remove group creator');
      }
      await group.removeMember(userId);

      // Update group session after member removal
      const remainingMembers = group.members.map(m => m.user.toString());
      await _messageEncryptionService.default.setupGroupSession(group._id, remainingMembers);
      return group;
    } catch (error) {
      _logger.default.error('Error in removing group member:', error);
      throw error;
    }
  }

  // Change member role
  async changeMemberRole(groupId, adminId, userId, newRole) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if admin is authorized
      if (!group.admins.includes(adminId)) {
        throw new Error('Not authorized to change member roles');
      }

      // Cannot change creator's role
      if (group.creator.toString() === userId.toString()) {
        throw new Error('Cannot change creator\'s role');
      }
      await group.changeMemberRole(userId, newRole);
      return group;
    } catch (error) {
      _logger.default.error('Error in changing member role:', error);
      throw error;
    }
  }

  // Generate invite link
  async generateInviteLink(groupId, userId, options = {}) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is admin
      if (!group.admins.includes(userId)) {
        throw new Error('Not authorized to generate invite link');
      }
      const inviteCode = await group.generateInviteLink(options.maxUses, options.expiresIn);
      return {
        inviteLink: `${process.env.CLIENT_URL}/group/join/${inviteCode}`,
        expiresAt: group.inviteLink.expiresAt,
        maxUses: group.inviteLink.maxUses,
        uses: group.inviteLink.uses
      };
    } catch (error) {
      _logger.default.error('Error in generating invite link:', error);
      throw error;
    }
  }

  // Join group with invite link
  async joinGroupWithInvite(inviteCode, userId) {
    try {
      const group = await _Group.Group.findOne({
        'inviteLink.code': inviteCode
      });
      if (!group) {
        throw new Error('Invalid invite link');
      }

      // Validate invite link
      const isValid = await group.useInviteLink(inviteCode);
      if (!isValid) {
        throw new Error('Invite link has expired or reached maximum uses');
      }

      // Add member
      await group.addMember(userId);

      // Setup encryption for new member
      await _messageEncryptionService.default.setupGroupSession(group._id, [...group.members.map(m => m.user.toString()), userId]);
      return group;
    } catch (error) {
      _logger.default.error('Error in joining group with invite:', error);
      throw error;
    }
  }

  // Leave group
  async leaveGroup(groupId, userId) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Cannot leave if creator
      if (group.creator.toString() === userId.toString()) {
        throw new Error('Group creator cannot leave the group');
      }
      await group.removeMember(userId);

      // Update group session after member leaves
      const remainingMembers = group.members.map(m => m.user.toString());
      await _messageEncryptionService.default.setupGroupSession(group._id, remainingMembers);
      return true;
    } catch (error) {
      _logger.default.error('Error in leaving group:', error);
      throw error;
    }
  }

  // Delete group
  async deleteGroup(groupId, userId) {
    try {
      const group = await _Group.Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Only creator can delete group
      if (group.creator.toString() !== userId.toString()) {
        throw new Error('Only group creator can delete the group');
      }
      await group.remove();
      return true;
    } catch (error) {
      _logger.default.error('Error in deleting group:', error);
      throw error;
    }
  }

  // Get user's groups
  async getUserGroups(userId) {
    try {
      const groups = await _Group.Group.find({
        'members.user': userId
      }).populate('creator', 'username avatar').populate('members.user', 'username avatar status').sort({
        'metadata.lastActivity': -1
      });
      return groups;
    } catch (error) {
      _logger.default.error('Error in getting user groups:', error);
      throw error;
    }
  }

  // Search groups
  async searchGroups(query, userId) {
    try {
      const groups = await _Group.Group.find({
        $and: [{
          $or: [{
            name: {
              $regex: query,
              $options: 'i'
            }
          }, {
            description: {
              $regex: query,
              $options: 'i'
            }
          }]
        }, {
          isPrivate: false
        }]
      }).populate('creator', 'username avatar').limit(10);
      return groups;
    } catch (error) {
      _logger.default.error('Error in searching groups:', error);
      throw error;
    }
  }
}

// Create singleton instance
const groupService = new GroupService();
var _default = exports.default = groupService;