"use client";

import { FiSearch, FiX } from "react-icons/fi";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setCurrentPage: (page: number) => void;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
}: SearchBarProps) {
  return (
    <div className="hidden sm:block mb-4">
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by customer name, service type, ID, phone, or location..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}