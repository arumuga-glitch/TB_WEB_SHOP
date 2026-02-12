"use client";

import { FiBell } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";

interface NotificationsProps {
  showNotifications: boolean;
  toggleNotifications: () => void;
}

export function Notifications({ showNotifications, toggleNotifications }: NotificationsProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'right' | 'left'>('right');

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        toggleNotifications();
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Check viewport position on mobile
      const checkPosition = () => {
        if (dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          if (rect.right > viewportWidth - 20) {
            setDropdownPosition('left');
          } else {
            setDropdownPosition('right');
          }
        }
      };
      
      checkPosition();
      window.addEventListener('resize', checkPosition);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', checkPosition);
      };
    }
  }, [showNotifications, toggleNotifications]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && showNotifications) {
        toggleNotifications();
      }
    }

    if (showNotifications) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showNotifications, toggleNotifications]);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (showNotifications) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
        aria-expanded={showNotifications}
      >
        <FiBell className={`w-6 h-6 transition-colors ${showNotifications ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {showNotifications && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={toggleNotifications}
          />
          
          {/* Dropdown */}
          <div 
            className={`
              fixed md:absolute inset-x-0 md:inset-auto bottom-0 md:bottom-auto md:top-full 
              md:mt-2 z-50 bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl 
              shadow-xl border border-gray-200 dark:border-gray-700 md:max-h-96 max-h-[80vh]
              ${dropdownPosition === 'right' ? 'md:right-0' : 'md:left-0'}
              md:w-80 w-full transform transition-transform duration-200 ease-out
              ${showNotifications ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            `}
            style={{ bottom: 0 }}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button
                onClick={toggleNotifications}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl p-1"
                aria-label="Close notifications"
              >
                ✕
              </button>
            </div>
            
            {/* Desktop header */}
            <div className="hidden md:block px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You have 3 unread notifications</p>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-70px)] md:max-h-80">
              {[
                { id: 1, title: "New booking request", time: "2 minutes ago", unread: true },
                { id: 2, title: "Payment received", time: "1 hour ago", unread: true },
                { id: 3, title: "Service completed", time: "3 hours ago", unread: false },
                { id: 4, title: "Customer review received", time: "Yesterday", unread: false },
                { id: 5, title: "Monthly report ready", time: "2 days ago", unread: false },
              ].map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${notification.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${notification.unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {notification.unread && (
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}