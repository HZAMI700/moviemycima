export interface Movie {
  _id: string;
  title: string;
  titleAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  poster: string;
  thumbnail: string;
  trailer: string;
  rating: number;
  year: number;
  duration: string;
  genres: Genre[];
  actors: Actor[];
  embedLinks: string[];
  quality: string;
  language: string;
  views: number;
  featured: boolean;
  createdAt: string;
}

export interface Series {
  _id: string;
  title: string;
  titleAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  poster: string;
  thumbnail: string;
  rating: number;
  year: number;
  genres: Genre[];
  actors: Actor[];
  seasons: number;
  episodes: Episode[];
  status: string;
  views: number;
  featured: boolean;
  createdAt: string;
}

export interface Episode {
  _id: string;
  series: string;
  title: string;
  titleAr: string;
  season: number;
  episode: number;
  embedLinks: string[];
  thumbnail: string;
  duration: string;
  views: number;
  createdAt: string;
}

export interface Genre {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  image: string;
}

export interface Actor {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  image: string;
  bio: string;
  bioAr: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  avatar: string;
  bookmarks: Bookmark[];
  preferences: { language: string; quality: string };
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: { _id: string; name: string; avatar: string };
  itemId: string;
  itemType: 'Movie' | 'Series' | 'Episode';
  text: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

export interface Reply {
  _id: string;
  user: { _id: string; name: string; avatar: string };
  text: string;
  createdAt: string;
}

export interface Bookmark {
  item: Movie | Series;
  itemType: 'Movie' | 'Series';
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  movies?: T[];
  series?: T[];
  comments?: T[];
  users?: T[];
}
