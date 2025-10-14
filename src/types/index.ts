type Author = { id: number; name: string | null };

export type PostAnswer = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  reactions?: { like: number; dislike: number };
  author: Author;
  created_at: string;
};
