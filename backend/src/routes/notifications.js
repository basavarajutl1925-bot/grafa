const express = require('express');
const Notification = require('../models/Notification');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user notifications
 * GET /api/notifications?isRead=false&limit=20&page=1
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isRead, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ sentAt: -1 })
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Mark as read
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      message: 'All notifications marked as read',
      updated: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get unread count
 * GET /api/notifications/count/unread
 */
router.get('/count/unread', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification (Admin only)
 * POST /api/notifications/send
 */
router.post('/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userIds, title, message, type, data } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Provide array of userIds' });
    }

    const notifications = userIds.map(userId =>
      new Notification({
        userId,
        type: type || 'GENERAL',
        title,
        message,
        data: data || {},
      })
    );

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: `${notifications.length} notifications sent`,
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Broadcast notification (Admin only)
 * POST /api/notifications/broadcast
 * Sends to all users or filtered users
 */
router.post('/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, message, type, data, filter = {} } = req.body;
    const User = require('../models/User');

    // Find users based on filter
    const users = await User.find(filter).select('_id').lean();

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found matching filter' });
    }

    const notifications = users.map(user =>
      new Notification({
        userId: user._id,
        type: type || 'GENERAL',
        title,
        message,
        data: data || {},
      })
    );

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: `Broadcast sent to ${notifications.length} users`,
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
