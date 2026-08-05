import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Paperclip, Smile, Image as ImageIcon, Mic, X, Trash2, Edit2,
  CornerDownRight, Pin, PinOff, Download, Play, Pause, Search, Check,
  CheckCheck, ShieldAlert, ArrowLeft, MoreVertical, FileText, Sparkles,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat, Message } from '../../hooks/useChat';
import { useUsers } from '../../hooks/useUsers';
import { Language, translations } from '../../data/translations';
import { CachedAvatar } from '../ui/CachedAvatar';
import { compressImageFile } from '../../utils/imageCompressor';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  lang: Language;
  onClose?: () => void;
  onSelectChat?: (id: string, name: string, photo?: string) => void;
  embedded?: boolean;
}

// Quick Emojis & Stickers presets
const EMOJI_PRESETS = ['❤️', '🔥', '👍', '😂', '😮', '🚀', '💯', '⚡', '🎉', '🤖', '💀', '✨'];
const STICKER_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=sticker_cybergod',
  'https://api.dicebear.com/7.x/bottts/svg?seed=sticker_neonfire',
  'https://api.dicebear.com/7.x/bottts/svg?seed=sticker_matrixcat',
  'https://api.dicebear.com/7.x/bottts/svg?seed=sticker_ahi_hero',
  'https://api.dicebear.com/7.x/bottts/svg?seed=sticker_synthwave'
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientPhoto,
  lang,
  onClose,
  onSelectChat,
  embedded = false
}) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const {
    messages,
    sendMessage,
    toggleReaction,
    deleteMessage,
    editMessage,
    setTyping,
    markChatAsRead,
    pinMessage,
    unpinMessage,
    deleteChat,
    chats
  } = useChat(recipientId);

  const t = translations[lang] as any;

  // Active chat metadata
  const currentChat = useMemo(() => chats.find((c) => c.id === recipientId || c.participants?.includes(recipientId)), [chats, recipientId]);
  const isGroup = recipientId.startsWith('group_') || currentChat?.isGroup;

  // Input states
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // File & Media Attachment state
  const [stagedImages, setStagedImages] = useState<string[]>([]);
  const [stagedFile, setStagedFile] = useState<{ url: string; name: string; size: number; fileType: string } | null>(null);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio Playback state for voice messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (recipientId) {
      markChatAsRead(recipientId);
    }
  }, [messages, recipientId]);

  // Handle typing debounce
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setTyping(recipientId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(recipientId, false);
    }, 2000);
  };

  // Safe file downloader helper
  const handleDownloadFile = (e: React.MouseEvent, url: string, filename?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) return;

    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(parts[1] || '');
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      } catch (err) {
        console.warn('Failed base64 download:', err);
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file attachment selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const compressedDataUrl = await compressImageFile(file, 800, 0.8);
          setStagedImages((prev) => [...prev, compressedDataUrl]);
        } catch (err) {
          console.warn('Failed image compression:', err);
        }
      } else {
        // Document or generic file
        if (file.size > 800000) {
          window.dispatchEvent(
            new CustomEvent('aha_toast', {
              detail: lang === 'ru' ? 'Файл слишком велик (макс. 800 КБ)' : 'File too large (max 800 KB)'
            })
          );
          continue;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setStagedFile({
              url: evt.target.result as string,
              name: file.name,
              size: file.size,
              fileType: file.type || 'file'
            });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Voice recording controls
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('aha_toast', {
          detail: lang === 'ru' ? 'Микрофон недоступен' : 'Microphone unavailable'
        })
      );
    }
  };

  const stopVoiceRecordingAndSend = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await sendMessage(
          '',
          recipientId,
          'voice',
          replyingTo
            ? {
                id: replyingTo.id,
                text: replyingTo.text,
                senderId: replyingTo.senderId,
                type: replyingTo.type
              }
            : null,
          undefined,
          recordingSeconds,
          { url: base64Audio, name: 'voice_memo.webm', size: audioBlob.size, fileType: 'audio/webm' }
        );
        setReplyingTo(null);
      };
      reader.readAsDataURL(audioBlob);

      // Stop tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  // Play Audio Voice Note
  const togglePlayAudio = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlayingAudioId(msgId);
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // Submit Message
  const handleSendSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (editingMsg) {
      if (inputText.trim()) {
        await editMessage(editingMsg.id, recipientId, inputText);
        setEditingMsg(null);
        setInputText('');
      }
      return;
    }

    if (
      !inputText.trim() &&
      stagedImages.length === 0 &&
      !stagedFile
    ) {
      return;
    }

    let type: 'text' | 'image' | 'file' = 'text';
    if (stagedImages.length > 0) type = 'image';
    else if (stagedFile) type = 'file';

    const replyObj = replyingTo
      ? {
          id: replyingTo.id,
          text: replyingTo.text,
          senderId: replyingTo.senderId,
          type: replyingTo.type
        }
      : null;

    await sendMessage(
      inputText,
      recipientId,
      type,
      replyObj,
      stagedImages.length > 0 ? stagedImages : undefined,
      undefined,
      stagedFile
    );

    setInputText('');
    setStagedImages([]);
    setStagedFile(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  // Filter messages by search
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#0d0714] text-white relative ${
        embedded ? 'rounded-none' : 'fixed inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[420px] sm:h-[620px] sm:rounded-3xl border border-[#ff4d4d]/40 shadow-2xl z-[9999] overflow-hidden'
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 bg-[#150f22] border-b border-[#3d2b4f] flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {!embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#251c35] hover:bg-[#ff4d4d] hover:text-[#15101e] text-gray-300 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="relative shrink-0">
            <CachedAvatar
              src={recipientPhoto || currentChat?.avatar}
              alt={recipientName}
              customSizeClass="w-10 h-10"
              className="rounded-full border border-[#ff4d4d]/50"
              fallbackText={recipientName}
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#150f22]" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
              {recipientName}
            </h3>
            <span className="text-[10px] text-gray-400 font-mono block truncate">
              {isGroup
                ? `${currentChat?.participants?.length || 1} ${lang === 'ru' ? 'участников' : 'members'}`
                : lang === 'ru' ? '🟢 В сети' : '🟢 Online'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showSearch
                ? 'bg-[#ff4d4d] text-[#15101e] border-[#ff4d4d]'
                : 'bg-[#251c35] hover:bg-[#322448] text-gray-300 border-[#3d2b4f]'
            }`}
            title={lang === 'ru' ? 'Поиск сообщений' : 'Search messages'}
          >
            <Search size={16} />
          </button>

          {/* Delete Chat Button */}
          <button
            type="button"
            onClick={async () => {
              if (confirm(lang === 'ru' ? 'Удалить этот чат?' : 'Delete this chat?')) {
                await deleteChat(recipientId);
                if (onClose) onClose();
              }
            }}
            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl transition-all cursor-pointer"
            title={lang === 'ru' ? 'Удалить чат' : 'Delete chat'}
          >
            <Trash2 size={16} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-[#251c35] hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Drawer */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2 bg-[#1b142b] border-b border-[#3d2b4f] shrink-0"
          >
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск в переписке...' : 'Search in chat...'}
                className="w-full bg-[#0d0714] border border-[#ff4d4d]/40 rounded-xl py-1.5 pl-8 pr-8 text-xs text-white outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Message Banner */}
      {currentChat?.pinnedMessage && (
        <div className="px-3 py-2 bg-[#ff4d4d]/10 border-b border-[#ff4d4d]/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Pin size={14} className="text-[#ff4d4d] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-[#ff4d4d] block">
                {lang === 'ru' ? 'Закрепленное сообщение' : 'Pinned Message'}
              </span>
              <p className="text-xs text-white truncate">{currentChat.pinnedMessage.text}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => unpinMessage(recipientId)}
            className="p-1 text-gray-400 hover:text-red-400 shrink-0 cursor-pointer"
            title={lang === 'ru' ? 'Открепить' : 'Unpin'}
          >
            <PinOff size={14} />
          </button>
        </div>
      )}

      {/* Messages Scrollable Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative">
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2 p-6">
            <Sparkles size={32} className="text-[#ff4d4d]/50 animate-pulse" />
            <p className="text-xs font-mono">
              {lang === 'ru' ? 'Здесь пока нет сообщений' : 'No messages here yet'}
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const senderUser = users.find((u) => u.uid === msg.senderId);
            const senderName = senderUser?.displayName || (isMe ? 'Вы' : 'Cyber User');

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Sender Name in group */}
                {isGroup && !isMe && (
                  <span className="text-[10px] font-bold text-purple-400 px-1">
                    {senderName}
                  </span>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-3 shadow-md ${
                    isMe
                      ? 'bg-gradient-to-br from-[#ff4d4d] to-[#d93838] text-[#15101e] rounded-tr-none font-medium'
                      : 'bg-[#1f1730] border border-[#3d2b4f] text-white rounded-tl-none'
                  }`}
                >
                  {/* Reply Snippet */}
                  {msg.replyTo && (
                    <div className={`mb-2 p-2 rounded-xl text-xs border-l-2 ${
                      isMe ? 'bg-[#15101e]/20 border-[#15101e] text-[#15101e]' : 'bg-[#150f22] border-[#ff4d4d] text-gray-300'
                    }`}>
                      <span className="font-bold block text-[10px] uppercase opacity-75">
                        {lang === 'ru' ? 'Ответ на сообщение' : 'In reply to'}
                      </span>
                      <p className="truncate">{msg.replyTo.text || 'Медиа'}</p>
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.text && (
                    <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  {/* Images Gallery */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Attachment"
                          onClick={() => setLightboxImage(img)}
                          className="rounded-xl max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/20"
                        />
                      ))}
                    </div>
                  )}

                  {/* File Attachment */}
                  {msg.fileAttachment && (
                    <div className={`mt-2 p-2.5 rounded-xl flex items-center justify-between gap-3 border ${
                      isMe ? 'bg-black/10 border-black/20' : 'bg-[#150f22] border-[#3d2b4f]'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={20} className={isMe ? 'text-[#15101e]' : 'text-[#ff4d4d]'} />
                        <div className="min-w-0">
                          <span className="text-xs font-bold truncate block">{msg.fileAttachment.name}</span>
                          <span className="text-[9px] opacity-75 font-mono">
                            {(msg.fileAttachment.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadFile(e, msg.fileAttachment!.url, msg.fileAttachment!.name)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isMe ? 'bg-[#15101e] text-white hover:bg-black' : 'bg-[#ff4d4d] text-[#15101e] hover:bg-white'
                        }`}
                      >
                        <Download size={14} className="stroke-[3]" />
                      </button>
                    </div>
                  )}

                  {/* Voice Message */}
                  {msg.type === 'voice' && msg.fileAttachment?.url && (
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => togglePlayAudio(msg.id, msg.fileAttachment!.url)}
                        className={`p-2.5 rounded-full transition-transform active:scale-95 cursor-pointer ${
                          isMe ? 'bg-[#15101e] text-white' : 'bg-[#ff4d4d] text-[#15101e]'
                        }`}
                      >
                        {playingAudioId === msg.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <div className="flex-1">
                        <div className="h-2 w-28 bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isMe ? 'bg-[#15101e]' : 'bg-[#ff4d4d]'} ${
                              playingAudioId === msg.id ? 'animate-pulse w-full' : 'w-1/2'
                            }`}
                          />
                        </div>
                        <span className="text-[9px] font-mono opacity-80 mt-1 block">
                          🎤 {msg.voiceDuration || 0}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer Meta (Timestamp + Edited/Deleted) */}
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                    isMe ? 'text-[#15101e]/80 font-bold' : 'text-gray-400 font-mono'
                  }`}>
                    {msg.isEdited && <span>({lang === 'ru' ? 'изм.' : 'edited'})</span>}
                    <CheckCheck size={12} />
                  </div>

                  {/* Hover Menu Controls */}
                  <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 p-1 bg-[#150f22] border border-[#3d2b4f] rounded-xl shadow-xl z-10 ${
                    isMe ? '-left-28' : '-right-28'
                  }`}>
                    {/* Reply */}
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 hover:text-[#ff4d4d] text-gray-300"
                      title={lang === 'ru' ? 'Ответить' : 'Reply'}
                    >
                      <CornerDownRight size={14} />
                    </button>

                    {/* Pin */}
                    <button
                      type="button"
                      onClick={() => pinMessage(recipientId, msg)}
                      className="p-1 hover:text-[#ff4d4d] text-gray-300"
                      title={lang === 'ru' ? 'Закрепить' : 'Pin'}
                    >
                      <Pin size={14} />
                    </button>

                    {/* Edit (if own) */}
                    {isMe && !msg.isDeleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMsg(msg);
                          setInputText(msg.text);
                        }}
                        className="p-1 hover:text-[#ff4d4d] text-gray-300"
                        title={lang === 'ru' ? 'Редактировать' : 'Edit'}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    {/* Delete (if own) */}
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(msg.id, recipientId)}
                        className="p-1 hover:text-red-400 text-gray-300"
                        title={lang === 'ru' ? 'Удалить' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reactions list */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(msg.id, recipientId, emoji)}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 cursor-pointer ${
                          uids.includes(user?.uid || '')
                            ? 'bg-[#ff4d4d]/20 border-[#ff4d4d] text-[#ff4d4d]'
                            : 'bg-[#1f1730] border-[#3d2b4f] text-gray-300'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="font-mono">{uids.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Staged Attachments Drawer */}
      {(stagedImages.length > 0 || stagedFile) && (
        <div className="p-2 bg-[#1b142b] border-t border-[#3d2b4f] flex items-center gap-2 overflow-x-auto shrink-0">
          {stagedImages.map((img, idx) => (
            <div key={idx} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-[#ff4d4d]">
              <img src={img} alt="Staged" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setStagedImages((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-white rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {stagedFile && (
            <div className="relative p-2 bg-[#251c35] border border-[#ff4d4d] rounded-xl flex items-center gap-2 text-xs">
              <FileText size={16} className="text-[#ff4d4d]" />
              <span className="truncate max-w-[120px]">{stagedFile.name}</span>
              <button
                type="button"
                onClick={() => setStagedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Replying or Editing Banner */}
      {(replyingTo || editingMsg) && (
        <div className="px-3 py-1.5 bg-[#1f1730] border-t border-[#3d2b4f] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Sparkles size={14} className="text-[#ff4d4d]" />
            <span className="font-bold text-[#ff4d4d]">
              {editingMsg
                ? (lang === 'ru' ? 'Редактирование:' : 'Editing:')
                : (lang === 'ru' ? 'Ответ на:' : 'Replying to:')}
            </span>
            <span className="truncate text-gray-300">
              {editingMsg ? editingMsg.text : replyingTo?.text}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyingTo(null);
              setEditingMsg(null);
              setInputText('');
            }}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Voice Recorder Overlay */}
      {isRecording ? (
        <div className="p-3 bg-[#1f1730] border-t border-[#ff4d4d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-red-400 font-mono text-xs animate-pulse">
            <Mic size={18} />
            <span>Запись голоса: {recordingSeconds}s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-xl"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={stopVoiceRecordingAndSend}
              className="px-3 py-1.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] text-xs font-black rounded-xl shadow-lg"
            >
              Отправить
            </button>
          </div>
        </div>
      ) : (
        /* Standard Input Bar */
        <div className="p-3 bg-[#150f22] border-t border-[#3d2b4f] relative shrink-0">
          {/* Emoji & Sticker Picker Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 left-3 bg-[#1f1730] border border-[#ff4d4d]/40 rounded-2xl p-3 shadow-2xl z-30 w-72 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">
                    Эмодзи & Стикеры
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div>
                  <span className="text-[9px] text-gray-500 uppercase block mb-1">Реакции</span>
                  <div className="grid grid-cols-6 gap-1.5 text-lg">
                    {EMOJI_PRESETS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + e);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1 hover:bg-[#2e2347] rounded-xl transition-all"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-gray-500 uppercase block mb-1">Стикеры</span>
                  <div className="flex gap-2 overflow-x-auto p-1 custom-scrollbar">
                    {STICKER_PRESETS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sendMessage('', recipientId, 'sticker', undefined, [s]);
                          setShowEmojiPicker(false);
                        }}
                        className="w-12 h-12 shrink-0 bg-[#150f22] hover:bg-[#ff4d4d]/20 border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-xl p-1 transition-all"
                      >
                        <img src={s} alt="Sticker" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendSubmit} className="flex items-center gap-2">
            {/* File Upload Button */}
            <label className="p-2 bg-[#251c35] hover:bg-[#322448] text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer">
              <Paperclip size={18} />
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* Emoji Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 bg-[#251c35] hover:bg-[#322448] text-gray-300 hover:text-[#ff4d4d] rounded-xl transition-all cursor-pointer"
            >
              <Smile size={18} />
            </button>

            {/* Input Field */}
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendSubmit();
                }
              }}
              placeholder={lang === 'ru' ? 'Написать сообщение...' : 'Type a message...'}
              className="flex-1 bg-[#0d0714] border border-[#3d2b4f] focus:border-[#ff4d4d] rounded-2xl py-2 px-3 text-xs text-white placeholder-gray-500 outline-none resize-none max-h-24 leading-normal transition-colors"
            />

            {/* Voice Record Button or Send Button */}
            {!inputText.trim() && stagedImages.length === 0 && !stagedFile ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 bg-[#251c35] hover:bg-[#ff4d4d] text-gray-300 hover:text-[#15101e] rounded-2xl transition-all cursor-pointer shadow-md"
                title={lang === 'ru' ? 'Записать голос' : 'Voice memo'}
              >
                <Mic size={18} />
              </button>
            ) : (
              <button
                type="submit"
                className="p-2.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] rounded-2xl transition-all cursor-pointer shadow-[0_0_15px_rgba(255,77,77,0.4)] active:scale-95"
              >
                <Send size={18} className="stroke-[2.5]" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <img
                src={lightboxImage}
                alt="Enlarged preview"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-4 -right-4 p-2 bg-[#ff4d4d] text-[#15101e] rounded-full font-bold shadow-lg"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
