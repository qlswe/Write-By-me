import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Heart, ThumbsUp, Laugh, MessageCircle, Flame, Sparkles, Ghost } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Language, translations } from '../../data/translations';

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

  const REACTION_ICONS: Record<string, { icon: any, color: string, label: string }> = {
    'like': { icon: ThumbsUp, color: 'text-blue-400', label: t.reactionLike },
    'love': { icon: Heart, color: 'text-red-400', label: t.reactionLove },
    'haha': { icon: Laugh, color: 'text-yellow-400', label: t.reactionHaha },
    'wow': { icon: Ghost, color: 'text-purple-400', label: t.reactionWow },
    'fire': { icon: Flame, color: 'text-orange-500', label: t.reactionFire },
    'sparkle': { icon: Sparkles, color: 'text-yellow-300', label: t.reactionSparkle },
  };

  const REACTION_KEYS = Object.keys(REACTION_ICONS);

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
      
      let previousKey: string | null = null;
      for (const [k, users] of Object.entries(currentReactions)) {
        if ((users as string[]).includes(user.uid)) {
          previousKey = k;
          break;
        }
      }

      if (previousKey === key) {
        updates[`reactions.${key}`] = arrayRemove(user.uid);
      } else {
        if (previousKey) {
          updates[`reactions.${previousKey}`] = arrayRemove(user.uid);
        }
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
      {REACTION_KEYS.map(key => {
        const { icon: Icon, color, label } = REACTION_ICONS[key];
        const users = reactions[key] || [];
        const count = users.length;
        const hasReacted = user && users.includes(user.uid);
        
        return (
          <button
            key={key}
            onClick={(e) => { e.stopPropagation(); handleReaction(key); }}
            disabled={!user}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all border shrink-0 ${
              hasReacted 
                ? 'bg-[#C3A6E6]/20 border-[#C3A6E6]/50 text-[#C3A6E6] shadow-[0_0_15px_rgba(195,166,230,0.15)] scale-105' 
                : count > 0
                  ? 'bg-[#2F244F]/60 border-[#5C4B8B]/50 text-gray-300 hover:border-[#C3A6E6]/40'
                  : 'bg-[#1a142e]/40 border-[#5C4B8B]/20 text-gray-500 hover:border-[#5C4B8B]/50 hover:text-gray-400'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
          >
            <Icon size={16} className={`${hasReacted ? color : (count === 0 ? 'grayscale opacity-50' : color + ' opacity-80')}`} />
            {count > 0 && <span className="font-black text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};
