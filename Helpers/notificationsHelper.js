const Notification = require('../models/notification.model');

// Send notification to all users
async function sendNotificationToAll(io, connectedUsers, notificationData) {
  try {
    // For now, we'll send to all connected users
    // If you have a User model, you can fetch all userIds from there
    
    // Get all connected user IDs
    const userIds = Array.from(connectedUsers.keys());
    
    if (userIds.length === 0) {
      console.log('No users connected to send notifications');
      return [];
    }

    // Create notification records for all users
    const notifications = userIds.map(userId => ({
      userId: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      feedId: notificationData.feedId,
      feedImage: notificationData.feedImage
    }));

    // Save all notifications to database
    const savedNotifications = await Notification.insertMany(notifications);
    console.log(`Created ${savedNotifications.length} notifications in database`);

    // Send real-time notifications to all connected users
    userIds.forEach(userId => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit('new_notification', {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          feedId: notificationData.feedId,
          feedImage: notificationData.feedImage,
          createdAt: new Date(),
          isRead: false
        });
        console.log(`Sent real-time notification to user ${userId}`);
      }
    });

    return savedNotifications;
  } catch (error) {
    console.error('Error sending notifications to all:', error);
    throw error;
  }
}

// Send notification to specific user
async function sendNotificationToUser(io, connectedUsers, userId, notificationData) {
  try {
    // Save notification to database
    const notification = await Notification.create({
      userId: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      feedId: notificationData.feedId,
      feedImage: notificationData.feedImage
    });

    console.log(`Created notification for user ${userId} in database`);

    // Send real-time notification if user is online
    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('new_notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        feedId: notification.feedId,
        feedImage: notification.feedImage,
        createdAt: notification.createdAt,
        isRead: notification.isRead
      });
      console.log(`Sent real-time notification to user ${userId}`);
    } else {
      console.log(`User ${userId} is offline, notification saved to database`);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    throw error;
  }
}

module.exports = {
  sendNotificationToAll,
  sendNotificationToUser
};