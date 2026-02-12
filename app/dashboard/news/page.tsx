"use client"
import { useEffect, useState } from "react";
import { getNewsList } from "@/lib/api";
import { NewsItem } from "@/types/news";

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_URL

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


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-gray-600 dark:text-gray-300">Loading news...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => {
            const imagePath =
              item.image_i18n.ta || item.image_i18n.en;

            const fullImageUrl = imagePath
              ? `${BASE_URL}${imagePath}`
              : null;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {fullImageUrl && (
                  <img
                    src={fullImageUrl}
                    alt={item.title_i18n.en}
                    className="h-48 w-full object-cover"
                  />
                )}

                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title_i18n.en}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                    {item.description_i18n.en}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
