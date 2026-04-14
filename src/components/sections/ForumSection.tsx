import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Search, User as UserIcon, Shield, Clock, ArrowLeft, Send, Trash2, ChevronUp, ChevronDown, Pencil, X, Check } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { TimeAgo } from '../ui/TimeAgo';
import { ConfirmModal } from '../ui/ConfirmModal';
import { GoogleGenAI } from '@google/genai';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  commentCount: number;
  upvotes?: string[];
  downvotes?: string[];
  isEdited?: boolean;
}

interface ForumComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  upvotes?: string[];
  downvotes?: string[];
  isEdited?: boolean;
  isBot?: boolean;
  replyToId?: string;
}

interface ForumSectionProps {
  lang: Language;
  onOpenChat: (uid: string, name: string, photoURL?: string) => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
}

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'dummy' });

export const ForumSection: React.FC<ForumSectionProps> = ({ lang, onOpenChat, role }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{id: string, threadId: string} | null>(null);
  
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [editThreadContent, setEditThreadContent] = useState('');
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumThread[];
      setThreads(threadsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_threads');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    const q = query(collection(db, 'forum_comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ForumComment))
        .filter(c => c.threadId === selectedThread.id);
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_comments');
    });
    return () => unsubscribe();
  }, [selectedThread]);

  const moderateContent = async (text: string): Promise<boolean> => {
    try {
      if (!(import.meta as any).env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) return true;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a strict automated moderation bot for a forum called "Aha Forum". 
Analyze the following text and determine if it contains ANY profanity, hate speech, illegal content, or extreme toxicity.
You MUST catch all variations of Russian swear words (mat), including misspellings, transliterations, and symbol substitutions (e.g., пиздец, пiздец, p1zdec, хуй, xyu, бля, blya, ебать, etc.). ANY variation of these words is COMPLETELY FORBIDDEN.
If there is even a hint of profanity or offensive language, return {"isApproved": false}.
Otherwise, return {"isApproved": true}.
Respond ONLY with a JSON object in the following format:
{"isApproved": true/false}

Text to analyze:
"${text}"`
      });
      const resultText = response.text;
      if (resultText) {
        const match = resultText.match(/\{.*\}/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return parsed.isApproved;
        }
      }
      return true;
    } catch (error) {
      console.error('Moderation error:', error);
      return true; // fail open
    }
  };

  const handleCreateThread = async () => {
    if (!user || !newTitle.trim() || !newContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isApproved = await moderateContent(newTitle + " " + newContent);
      if (!isApproved) {
        alert(t.forumModerationRejectedPost);
        setIsSubmitting(false);
        return;
      }

      const threadRef = await addDoc(collection(db, 'forum_threads'), {
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        commentCount: 1,
        upvotes: [],
        downvotes: []
      });

      await addDoc(collection(db, 'forum_comments'), {
        threadId: threadRef.id,
        content: t.forumBotWelcome,
        authorId: 'system-bot',
        authorName: 'Aha Bot',
        authorPhoto: 'https://ui-avatars.com/api/?name=Aha+Bot&background=ff4d4d&color=15101e',
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: [],
        isBot: true
      });

      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_threads');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateComment = async (replyToId?: string) => {
    const contentToSubmit = replyToId ? replyContent : newComment;
    if (!user || !selectedThread || !contentToSubmit.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isApproved = await moderateContent(contentToSubmit);
      if (!isApproved) {
        alert(t.forumModerationRejectedComment);
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'forum_comments'), {
        threadId: selectedThread.id,
        content: contentToSubmit.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: [],
        ...(replyToId ? { replyToId } : {})
      });
      
      const threadRef = doc(db, 'forum_threads', selectedThread.id);
      await updateDoc(threadRef, {
        commentCount: (selectedThread.commentCount || 0) + 1
      });
      
      if (replyToId) {
        setReplyContent('');
        setReplyingToCommentId(null);
      } else {
        setNewComment('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_threads', threadToDelete));
      if (selectedThread?.id === threadToDelete) setSelectedThread(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_threads/${threadToDelete}`);
    } finally {
      setThreadToDelete(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteDoc(doc(db, 'forum_comments', commentToDelete.id));
      const threadRef = doc(db, 'forum_threads', commentToDelete.threadId);
      const threadDoc = await getDoc(threadRef);
      if (threadDoc.exists()) {
        await updateDoc(threadRef, {
          commentCount: Math.max(0, (threadDoc.data().commentCount || 1) - 1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_comments/${commentToDelete.id}`);
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleUpdateThread = async () => {
    if (!editingThreadId || !editThreadTitle.trim() || !editThreadContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isApproved = await moderateContent(editThreadTitle + " " + editThreadContent);
      if (!isApproved) {
        alert(t.forumModerationRejectedPost);
        setIsSubmitting(false);
        return;
      }
      await updateDoc(doc(db, 'forum_threads', editingThreadId), {
        title: editThreadTitle.trim(),
        content: editThreadContent.trim(),
        isEdited: true
      });
      setEditingThreadId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_threads/${editingThreadId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editCommentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isApproved = await moderateContent(editCommentContent);
      if (!isApproved) {
        alert(t.forumModerationRejectedComment);
        setIsSubmitting(false);
        return;
      }
      await updateDoc(doc(db, 'forum_comments', editingCommentId), {
        content: editCommentContent.trim(),
        isEdited: true
      });
      setEditingCommentId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_comments/${editingCommentId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (type: 'thread' | 'comment', item: ForumThread | ForumComment, voteType: 'up' | 'down') => {
    if (!user) return;
    
    const collectionName = type === 'thread' ? 'forum_threads' : 'forum_comments';
    const docRef = doc(db, collectionName, item.id);
    const upvotes = item.upvotes || [];
    const downvotes = item.downvotes || [];
    
    const hasUpvoted = upvotes.includes(user.uid);
    const hasDownvoted = downvotes.includes(user.uid);
    
    let xpChange = 0;

    try {
      if (voteType === 'up') {
        if (hasUpvoted) {
          await updateDoc(docRef, { upvotes: arrayRemove(user.uid) });
          xpChange = -5;
        } else {
          await updateDoc(docRef, {
            upvotes: arrayUnion(user.uid),
            downvotes: arrayRemove(user.uid)
          });
          xpChange = hasDownvoted ? 10 : 5;
        }
      } else {
        if (hasDownvoted) {
          await updateDoc(docRef, { downvotes: arrayRemove(user.uid) });
          xpChange = 5;
        } else {
          await updateDoc(docRef, {
            downvotes: arrayUnion(user.uid),
            upvotes: arrayRemove(user.uid)
          });
          xpChange = hasUpvoted ? -10 : -5;
        }
      }

      if (item.authorId !== 'system-bot' && item.authorId !== user.uid) {
        const authorRef = doc(db, 'users', item.authorId);
        await updateDoc(authorRef, {
          xp: increment(xpChange),
          reputation: increment(xpChange > 0 ? 1 : (xpChange < 0 ? -1 : 0))
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${item.id}`);
    }
  };

  useEffect(() => {
    if (selectedThread) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedThread]);

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedThread) {
    const topLevelComments = comments.filter(c => !c.replyToId);
    const getReplies = (parentId: string) => comments.filter(c => c.replyToId === parentId);

    const renderComment = (comment: ForumComment, isReply: boolean = false) => (
      <motion.div 
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-[#15101e] border border-[#3d2b4f]/20 rounded-2xl p-4 sm:p-5 flex gap-4 group ${comment.isBot ? 'border-[#ff4d4d]/50 bg-[#ff4d4d]/5' : ''} ${isReply ? 'ml-8 sm:ml-12 mt-2 border-l-2 border-l-[#ff4d4d]/30' : ''}`}
      >
        <img 
          src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1c1528&color=fff`}
          alt={comment.authorName}
          className="w-10 h-10 rounded-full border border-[#3d2b4f]/50 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="font-bold text-white text-sm truncate flex items-center gap-2">
              {comment.authorName}
              {comment.isBot && <Shield size={12} className="text-[#ff4d4d]" />}
              {comment.isEdited && <span className="text-[10px] text-gray-500 font-normal">({t.edited || "edited"})</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                <TimeAgo date={comment.createdAt} lang={lang} />
              </div>
              <div className={`flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${comment.isBot ? 'hidden' : ''}`}>
                {user?.uid === comment.authorId && !comment.isBot && (
                  <button 
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditCommentContent(comment.content);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-400 transition-all rounded-md hover:bg-blue-400/10"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {(user?.uid === comment.authorId || role === 'admin' || role === 'moderator' || role === 'beta-tester') && !comment.isBot && (
                  <button 
                    onClick={() => setCommentToDelete({id: comment.id, threadId: selectedThread.id})}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-all rounded-md hover:bg-red-400/10"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {editingCommentId === comment.id ? (
            <div className="mt-2 space-y-3">
              <textarea
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] min-h-[80px] resize-y text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold"
                >
                  {t.forumCancel}
                </button>
                <button
                  onClick={handleUpdateComment}
                  disabled={!editCommentContent.trim() || isSubmitting}
                  className="bg-[#ff4d4d] text-[#15101e] px-4 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? '...' : t.forumSave}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-300 text-sm whitespace-pre-wrap break-words mb-3">{comment.content}</p>
              <div className="flex items-center justify-between">
                {!comment.isBot && (
                  <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-lg border border-[#3d2b4f]/30 w-fit">
                    <button
                      onClick={() => handleVote('comment', comment, 'up')}
                      disabled={!user}
                      className={`p-1 rounded transition-all ${comment.upvotes?.includes(user?.uid || '') ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-green-500 hover:bg-green-500/5'}`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className={`text-[10px] font-black px-2 min-w-[1.5rem] text-center ${((comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)) > 0 ? 'text-green-500' : ((comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {(comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)}
                    </span>
                    <button
                      onClick={() => handleVote('comment', comment, 'down')}
                      disabled={!user}
                      className={`p-1 rounded transition-all ${comment.downvotes?.includes(user?.uid || '') ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-500/5'}`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                )}
                
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${comment.isBot ? 'ml-auto' : ''}`}>
                  {user && !comment.isBot && !isReply && (
                    <button 
                      onClick={() => setReplyingToCommentId(comment.id)}
                      className="p-1.5 text-gray-500 hover:text-[#ff4d4d] transition-all rounded-md hover:bg-[#ff4d4d]/10 text-xs font-bold uppercase tracking-widest"
                    >
                      {t.forumReply}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {replyingToCommentId === comment.id && (
            <div className="mt-4 bg-[#0d0b14] rounded-xl p-3 border border-[#3d2b4f]/30">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t.forumYourReply}
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none min-h-[60px] resize-y text-sm mb-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setReplyingToCommentId(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold"
                >
                  {t.forumCancel}
                </button>
                <button
                  onClick={() => handleCreateComment(comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="bg-[#ff4d4d] text-[#15101e] px-4 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 text-xs flex items-center gap-2"
                >
                  {isSubmitting ? '...' : (
                    <>
                      <Send size={12} />
                      {t.forumReply}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedThread(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-widest text-sm">{t.forumBack}</span>
        </button>

        <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={selectedThread.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedThread.authorName)}&background=1c1528&color=fff`}
                alt={selectedThread.authorName}
                className="w-12 h-12 rounded-full border-2 border-[#3d2b4f]/50"
              />
              <div>
                <div className="font-black text-white flex items-center gap-2">
                  {selectedThread.authorName}
                  {selectedThread.isEdited && <span className="text-[10px] text-gray-500 font-normal">({t.edited || "edited"})</span>}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Clock size={12} />
                  <TimeAgo date={selectedThread.createdAt} lang={lang} />
                </div>
              </div>
            </div>
            {(user?.uid === selectedThread.authorId || role === 'admin' || role === 'moderator') && (
              <div className="flex items-center gap-2">
                {user?.uid === selectedThread.authorId && (
                  <button 
                    onClick={() => {
                      setEditingThreadId(selectedThread.id);
                      setEditThreadTitle(selectedThread.title);
                      setEditThreadContent(selectedThread.content);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-400 transition-all rounded-lg hover:bg-blue-400/10"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                <button 
                  onClick={() => setThreadToDelete(selectedThread.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          {editingThreadId === selectedThread.id ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] font-bold"
              />
              <textarea
                value={editThreadContent}
                onChange={(e) => setEditThreadContent(e.target.value)}
                className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] min-h-[150px] resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingThreadId(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors text-sm font-bold"
                >
                  {t.forumCancel}
                </button>
                <button
                  onClick={handleUpdateThread}
                  disabled={!editThreadTitle.trim() || !editThreadContent.trim() || isSubmitting}
                  className="bg-[#ff4d4d] text-[#15101e] px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? '...' : t.forumSave}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">{selectedThread.title}</h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">{selectedThread.content}</p>
              
              <div className="flex items-center gap-1 bg-[#0d0b14]/50 p-1 rounded-xl border border-[#3d2b4f]/30 w-fit">
                <button
                  onClick={() => handleVote('thread', selectedThread, 'up')}
                  disabled={!user}
                  className={`p-1.5 rounded-lg transition-all ${selectedThread.upvotes?.includes(user?.uid || '') ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-green-500 hover:bg-green-500/5'}`}
                >
                  <ChevronUp size={20} />
                </button>
                <span className={`text-xs font-black px-2 min-w-[2rem] text-center ${((selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)) > 0 ? 'text-green-500' : ((selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {(selectedThread.upvotes?.length || 0) - (selectedThread.downvotes?.length || 0)}
                </span>
                <button
                  onClick={() => handleVote('thread', selectedThread, 'down')}
                  disabled={!user}
                  className={`p-1.5 rounded-lg transition-all ${selectedThread.downvotes?.includes(user?.uid || '') ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-500/5'}`}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={20} className="text-[#ff4d4d]" />
            {t.forumDiscussion} ({comments.length})
          </h3>

          {user ? (
            <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-4 flex gap-4">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1c1528&color=fff`}
                alt={user.displayName}
                className="w-10 h-10 rounded-full border border-[#3d2b4f]/50 hidden sm:block"
              />
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.forumWriteComment}
                  className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCreateComment()}
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-[#ff4d4d] text-[#15101e] px-6 py-2 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <span className="animate-pulse">...</span> : <><Send size={16} /> {t.forumSend}</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#15101e]/50 border border-[#3d2b4f]/30 rounded-3xl p-6 text-center text-gray-400">
              {t.forumLoginToComment}
            </div>
          )}

          <div className="space-y-4 mt-8">
            {topLevelComments.map(comment => (
              <React.Fragment key={comment.id}>
                {renderComment(comment)}
                {getReplies(comment.id).map(reply => renderComment(reply, true))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">
            {t.forumNewThread}
          </h2>
          <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t.forumThreadTitle}
            className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] font-bold"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t.forumMessageContent}
            className="w-full bg-[#0d0b14] border border-[#3d2b4f]/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] min-h-[200px] resize-y"
          />
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              {t.forumCancel}
            </button>
            <button
              onClick={handleCreateThread}
              disabled={!newTitle.trim() || !newContent.trim() || isSubmitting}
              className="bg-[#ff4d4d] text-[#15101e] px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,77,77,0.3)]"
            >
              {isSubmitting ? '...' : t.forumCreate}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
          <MessageSquare className="text-[#ff4d4d]" size={32} />
          {t.forumTitle}
        </h2>
        {user && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[#ff4d4d] text-[#15101e] px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-[0_0_20px_rgba(255,77,77,0.3)] flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            {t.forumCreateThread}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.forumSearch}
          className="w-full bg-[#15101e] border border-[#3d2b4f]/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-colors"
        />
      </div>

      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-[#15101e]/30 rounded-3xl border border-[#3d2b4f]/20">
            {t.forumNoThreads}
          </div>
        ) : (
          filteredThreads.map(thread => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedThread(thread);
              }}
              className="bg-[#15101e] border border-[#3d2b4f]/30 rounded-3xl p-5 sm:p-6 hover:border-[#ff4d4d]/50 hover:bg-[#251c35] transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <h3 className="text-xl font-black text-white group-hover:text-[#ff4d4d] transition-colors line-clamp-2">
                  {thread.title}
                </h3>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm bg-[#0d0b14] px-3 py-1.5 rounded-lg">
                    <MessageSquare size={14} />
                    <span className="font-bold">{thread.commentCount || 0}</span>
                  </div>
                  {(user?.uid === thread.authorId || role === 'admin' || role === 'moderator') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadToDelete(thread.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                {thread.content}
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src={thread.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.authorName)}&background=1c1528&color=fff`}
                  alt={thread.authorName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs font-bold text-gray-300">{thread.authorName}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={10} />
                  <TimeAgo date={thread.createdAt} lang={lang} />
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!threadToDelete}
        onClose={() => setThreadToDelete(null)}
        onConfirm={confirmDeleteThread}
        title={t.forumDeleteThreadTitle}
        message={t.forumDeleteThreadMessage}
        confirmText={t.forumDelete}
        cancelText={t.forumCancel}
      />

      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title={t.forumDeleteCommentTitle}
        message={t.forumDeleteCommentMessage}
        confirmText={t.forumDelete}
        cancelText={t.forumCancel}
      />
    </div>
  );
};
