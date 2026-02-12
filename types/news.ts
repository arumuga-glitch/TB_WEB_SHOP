export interface NewsItem {
  id: string;
  title_i18n: {
    en: string;
    ta?: string;
  };
  description_i18n: {
    en: string;
    ta?: string;
  };
  image_i18n: {
    en?: string;
    ta?: string;
  };
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface NewsResponse {
  success: boolean;
  message: string;
  data: {
    items: NewsItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  };
}
