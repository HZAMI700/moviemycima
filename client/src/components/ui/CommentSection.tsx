'use client';

import { useState, useEffect } from 'react';
import { HiHeart, HiOutlineHeart, HiTrash } from 'react-icons/hi';
import { commentsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { Comment } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  itemId: string;
  itemType: 'Movie' | 'Series' | 'Episode';
}

export default function CommentSection({ itemId, itemType }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchComments();
  }, [itemId, page]);

  const fetchComments = async () => {
    try {
      const { data } = await commentsAPI.get({ itemId, itemType, page, limit: 20 });
      if (page === 1) setComments(data.comments || []);
      else setComments(prev => [...prev, ...(data.comments || [])]);
      setHasMore(data.page < data.pages);
    } catch {} finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!user) return toast.error('سجل الدخول أولاً');
    if (!text.trim()) return;
    try {
      const { data } = await commentsAPI.create({ itemId, itemType, text: text.trim() });
      setComments(prev => [data, ...prev]);
      setText('');
      toast.success('تم إضافة التعليق');
    } catch { toast.error('فشل إضافة التعليق'); }
  };

  const deleteComment = async (id: string) => {
    try {
      await commentsAPI.delete(id);
      setComments(prev => prev.filter(c => c._id !== id));
      toast.success('تم حذف التعليق');
    } catch { toast.error('فشل حذف التعليق'); }
  };

  const toggleLike = async (id: string) => {
    if (!user) return toast.error('سجل الدخول أولاً');
    try {
      const { data } = await commentsAPI.like(id);
      setComments(prev => prev.map(c => c._id === id ? data : c));
    } catch {}
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">التعليقات</h3>

      {user && (
        <div className="flex gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.name[0]}
          </div>
          <div className="flex-1">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="اكتب تعليقاً..." rows={3}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none" />
            <div className="flex justify-end mt-2">
              <button onClick={submitComment} disabled={!text.trim()} className="btn-primary text-sm !py-2 !px-5">نشر</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-dark-400 text-center py-10">لا توجد تعليقات بعد. كن أول من يعلق!</p>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment._id} className="bg-dark-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {comment.user?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{comment.user?.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLike(comment._id)} className="text-dark-400 hover:text-red-400 transition-colors">
                        {comment.likes?.includes(user?._id || '') ? <HiHeart className="w-4 h-4 text-red-500" /> : <HiOutlineHeart className="w-4 h-4" />}
                      </button>
                      {(user?._id === comment.user?._id || user?.role === 'admin') && (
                        <button onClick={() => deleteComment(comment._id)} className="text-dark-400 hover:text-red-400 transition-colors">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-dark-200">{comment.text}</p>
                  <span className="text-xs text-dark-500 mt-1 block">{new Date(comment.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <button onClick={() => setPage(p => p + 1)} className="w-full py-3 text-dark-400 hover:text-white text-sm transition-colors">عرض المزيد</button>
          )}
        </div>
      )}
    </div>
  );
}
