"use client";

import { useEffect, useState } from "react";
import { getNewsList } from "@/lib/api";
import { NewsItem } from "@/types/news";
import { Calendar, Clock, ChevronRight, X } from "lucide-react";

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_URL;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getNewsList();
        setNews(res.data.items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedNews) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedNews]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 ml-1">
            Latest Updates
          </h1>
          <p className="text-gray-500 dark:text-gray-400 ml-1">
            Stay informed with the latest announcements and news from Thendral Booking.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <NewsSkeleton key={i} />)
            : news.map((item) => {
              const imagePath = item.image_i18n?.ta || item.image_i18n?.en;
              const fullImageUrl = imagePath ? `${BASE_URL}${imagePath}` : null;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl dark:hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full cursor-pointer"
                >
                  {/* Image Section */}
                  <div className="relative h-60 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={item.title_i18n?.en}
                        className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Date Badge */}
                    <div className="absolute top-5 left-5">
                      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg border border-white/20">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-7 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title_i18n?.en}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-8 flex-grow">
                      {item.description_i18n?.en}
                    </p>

                    <div className="pt-5 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-tighter">
                          {new Date(item.created_at).getFullYear()} Update
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        <span>Read Full</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedNews(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300" />

          {/* Modal Container */}
          <div
            className="relative bg-white dark:bg-gray-800 w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative h-64 sm:h-80 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
              {(selectedNews.image_i18n?.ta || selectedNews.image_i18n?.en) ? (
                <img
                  src={`${BASE_URL}${selectedNews.image_i18n?.ta || selectedNews.image_i18n?.en}`}
                  className="w-full h-full object-cover"
                  alt={selectedNews.title_i18n?.en}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all active:scale-95 border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Official Announcement
                  </span>
                  <span className="text-white/60 text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedNews.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {selectedNews.title_i18n?.en}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 sm:p-10 overflow-y-auto flex-grow custom-scrollbar">
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedNews.description_i18n?.en}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="text-slate-400 text-xs font-medium uppercase text-center sm:text-left">
                  End of post
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-8 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-semibold transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700/50 p-0 h-[480px]">
      <div className="h-60 bg-slate-100 dark:bg-gray-700 animate-pulse" />
      <div className="p-7 space-y-5">
        <div className="h-4 bg-slate-100 dark:bg-gray-700 animate-pulse w-1/3 rounded-full" />
        <div className="space-y-3">
          <div className="h-7 bg-slate-100 dark:bg-gray-700 animate-pulse rounded-xl" />
          <div className="h-7 bg-slate-100 dark:bg-gray-700 animate-pulse rounded-xl w-4/5" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-slate-50 dark:bg-gray-700/50 animate-pulse rounded-lg" />
          <div className="h-4 bg-slate-50 dark:bg-gray-700/50 animate-pulse rounded-lg w-full" />
          <div className="h-4 bg-slate-50 dark:bg-gray-700/50 animate-pulse rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  );
}
