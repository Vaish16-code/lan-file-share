import React from 'react';
import './Notifications.css';

const Notifications = ({ notifications, onRemove }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => onRemove(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {getNotificationIcon(notification.type)}
            </span>
            <span className="notification-message">
              {notification.message}
            </span>
          </div>
          <button 
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
