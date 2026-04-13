import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Heart, ThumbsUp, Laugh, MessageCircle, Flame, Sparkles, Ghost } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Language, translations } from '../../data/translations';

import { POST_REACTIONS as STANDARD_REACTIONS } from '../../constants/reactions';

interface ReactionsBarProps {
  targetId: string;
  lang: Language;
  collectionName?: string; // 'postReactions' by default
}

export const ReactionsBar: React.FC<ReactionsBarProps> = ({ targetId, lang, collectionName = 'postReactions' }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    const docRef = doc(db, collectionName, targetId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setReactions(docSnap.data().reactions || {});
      } else {
        setReactions({});
      }
    }, (error) => {
      // Ignore missing document errors for reactions
      if (!error.message.includes('Missing or insufficient permissions')) {
        console.error("Error fetching reactions:", error);
      }
    });

    return () => unsubscribe();
  }, [targetId, collectionName]);

  const handleReaction = async (key: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, collectionName, targetId);
      const docSnap = await getDoc(docRef);
      
      const currentReactions = docSnap.exists() ? (docSnap.data().reactions || {}) : {};
      const updates: Record<string, any> = {};
      
      const usersForEmoji = currentReactions[key] || [];

      if (usersForEmoji.includes(user.uid)) {
        updates[`reactions.${key}`] = arrayRemove(user.uid);
      } else {
        // Enforce 1 reaction per user: remove from all other emojis
        Object.keys(currentReactions).forEach(existingKey => {
          if (existingKey !== key && currentReactions[existingKey].includes(user.uid)) {
            updates[`reactions.${existingKey}`] = arrayRemove(user.uid);
          }
        });
        updates[`reactions.${key}`] = arrayUnion(user.uid);
      }
      
      if (Object.keys(updates).length > 0) {
        if (!docSnap.exists()) {
          // Initialize document if it doesn't exist
          const initialReactions: Record<string, string[]> = {};
          initialReactions[key] = [user.uid];
          await setDoc(docRef, { reactions: initialReactions });
        } else {
          await updateDoc(docRef, updates);
        }
      }
      setShowPicker(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${targetId}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 w-full overflow-visible" onClick={(e) => e.stopPropagation()}>
      {STANDARD_REACTIONS.map(emoji => {
        const users = reactions[emoji] || [];
        const count = users.length;
        const hasReacted = user && users.includes(user.uid);
        
        return (
          <button
            key={emoji}
            onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
            disabled={!user}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all border shrink-0 ${
              hasReacted 
                ? 'bg-[#ff4d4d]/20 border-[#ff4d4d]/50 text-white shadow-[0_0_15px_rgba(255,77,77,0.15)] scale-105' 
                : count > 0
                  ? 'bg-[#15101e]/60 border-[#3d2b4f]/50 text-gray-300 hover:border-[#ff4d4d]/40'
                  : 'bg-[#0d0b14]/40 border-[#3d2b4f]/20 text-gray-500 hover:border-[#3d2b4f]/50 hover:text-gray-400'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
          >
            <span className={`text-base ${!hasReacted && count === 0 ? 'opacity-50 grayscale' : ''}`}>{emoji}</span>
            {count > 0 && <span className="font-black text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
