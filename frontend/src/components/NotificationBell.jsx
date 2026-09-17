import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

import "./NotificationBell.css";
import API_URL from "../config";

export default function NotificationBell({ admin = false }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const bellRef = useRef(null);

  const endpoint = admin
    ? `${API_URL}/admin/notifications`
    : `${API_URL}/notifications`;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Notification fetch error:",
            response.status,
            data.message
          );
          return;
        }

        setNotifications(data.notifications || []);
      } catch (error) {
        console.error(
          "Notification connection error:",
          error
        );
      }
    };

    fetchNotifications();
  }, [endpoint]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

  const formatTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference =
      now.getTime() - notificationDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d`;
    }

    return notificationDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  const handleNotificationClick = async (
    notification
  ) => {
    try {
      if (!notification.isRead) {
        const response = await fetch(
          `${API_URL}/notifications/${notification.id}/read`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Mark notification as read error:",
            response.status,
            data.message
          );
          return;
        }

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );
      }

      setSelectedNotification(notification);
      setIsOpen(false);
    } catch (error) {
      console.error(
        "Notification read connection error:",
        error
      );
    }
  };

  return (
    <>
      <div
        className="notification-wrapper"
        ref={bellRef}
      >
        <button
          type="button"
          className={`notification-button ${
            unreadNotifications.length > 0
              ? "has-notifications"
              : ""
          }`}
          aria-label="Notifications"
          onClick={() =>
            setIsOpen((previous) => !previous)
          }
        >
          <Bell size={19} />

          {unreadNotifications.length > 0 && (
            <span className="notification-count">
              {unreadNotifications.length > 9
                ? "9+"
                : unreadNotifications.length}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <button
              type="button"
              className="notification-overlay"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            />

            <div className="notification-panel">
              <div className="notification-panel-header">
                <div>
                  <span className="notification-panel-eyebrow">
                    ACTIVITY
                  </span>

                  <h3>Notifications</h3>
                </div>

                <span className="notification-total">
                  {unreadNotifications.length}
                </span>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={18} />

                    <strong>No notifications</strong>

                    <span>
                      You're all caught up.
                    </span>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isRead = notification.isRead;

                    return (
                      <button
                        type="button"
                        className={`notification-item ${
                          isRead
                            ? "notification-item-read"
                            : "notification-item-unread"
                        }`}
                        key={notification.id}
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                      >
                        <span
                          className={`notification-item-dot ${
                            isRead
                              ? "notification-item-dot-read"
                              : ""
                          }`}
                        />

                        <span className="notification-item-content">
                          <strong>
                            {notification.title}
                          </strong>

                          <span>
                            {notification.message}
                          </span>
                        </span>

                        <span className="notification-time">
                          {formatTime(
                            notification.createdAt
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedNotification && (
        <div
          className="notification-modal-overlay"
          onClick={() =>
            setSelectedNotification(null)
          }
        >
          <div
            className="notification-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="notification-modal-header">
              <div className="notification-modal-icon">
                <Bell size={18} />
              </div>

              <button
                type="button"
                className="notification-modal-close"
                onClick={() =>
                  setSelectedNotification(null)
                }
                aria-label="Close notification"
              >
                <X size={17} />
              </button>
            </div>

            <div className="notification-modal-content">
              <span className="notification-panel-eyebrow">
                NOTIFICATION
              </span>

              <h2>
                {selectedNotification.title}
              </h2>

              <p>
                {selectedNotification.message}
              </p>

              {selectedNotification.details && (
                <div className="notification-details">
                  {Object.entries(
                    selectedNotification.details
                  ).map(([key, value]) => (
                    <div
                      className="notification-detail-row"
                      key={key}
                    >
                      <span>
                        {key
                          .replace(
                            /([A-Z])/g,
                            " $1"
                          )
                          .toUpperCase()}
                      </span>

                      <strong>
                        {value === null ||
                        value === undefined
                          ? "—"
                          : String(value)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              <span className="notification-modal-date">
                {selectedNotification.createdAt
                  ? new Date(
                      selectedNotification.createdAt
                    ).toLocaleString("en-IN")
                  : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}