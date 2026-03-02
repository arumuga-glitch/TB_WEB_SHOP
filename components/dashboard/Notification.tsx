"use client";

import { FiBell, FiTrash2, FiCheck, FiBookOpen } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface NotificationsProps {
  showNotifications: boolean;
  toggleNotifications: () => void;
}

export function Notifications({ showNotifications, toggleNotifications }: NotificationsProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'right' | 'left'>('right');
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  // Handle click outside to close — attach to document, NOT the wrapper div
  useEffect(() => {
    if (!showNotifications) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedButton && !clickedDropdown) {
        toggleNotifications();
      }
    }

    // Position check
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition(rect.right > window.innerWidth - 320 ? 'left' : 'right');
    }

    // Delay to avoid the button click itself triggering close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, toggleNotifications]);

  // Close on Escape
  useEffect(() => {
    if (!showNotifications) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') toggleNotifications();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showNotifications, toggleNotifications]);

  // ── NO body scroll lock — it causes layout flicker on dashboards ──

  return (
    <>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={toggleNotifications}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
        aria-expanded={showNotifications}
        id="notification-bell-btn"
      >
        <FiBell
          className={`w-6 h-6 transition-colors ${showNotifications
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300'
            }`}
        />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </>
        )}
      </button>

      {/* Mobile Backdrop */}
      {showNotifications && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={toggleNotifications}
        />
      )}

      {/* Dropdown Panel */}
      {showNotifications && (
        <div
          ref={dropdownRef}
          className={`
            fixed md:absolute
            inset-x-0 md:inset-auto
            bottom-0 md:bottom-auto md:top-full
            md:mt-2 z-50
            bg-white dark:bg-gray-800
            rounded-t-2xl md:rounded-2xl
            shadow-2xl border border-gray-200 dark:border-gray-700
            max-h-[80vh] md:max-h-[480px]
            md:w-80 w-full
            flex flex-col
            ${dropdownPosition === 'right' ? 'md:right-0' : 'md:left-0'}
          `}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <button
              onClick={toggleNotifications}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <FiTrash2 className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${notification.unread ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5">
                      <FiBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug text-gray-900 dark:text-white ${notification.unread ? 'font-semibold' : 'font-medium'
                        }`}>
                        {notification.title}
                      </p>
                      {notification.body ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.body}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                        {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread dot + mark read */}
                    <div className="flex flex-col items-center gap-2 pt-0.5">
                      {notification.unread && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                  <FiBell className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">No notifications yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  News updates will appear here when received
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Mark all read
            </button>
            <Link
              href="/dashboard/news"
              onClick={toggleNotifications}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <FiBookOpen className="w-3.5 h-3.5" />
              View all news
            </Link>
          </div>
        </div>
      )}
    </>
  );
}