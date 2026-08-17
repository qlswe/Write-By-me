import React, { useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  ListOrdered, 
  Code, 
  Link, 
  Table, 
  Eye, 
  Edit3, 
  Columns,
  Minus,
  Sparkles,
  HelpCircle,
  Undo2,
  Redo2
} from 'lucide-react';
import { Language, translations } from '../../data/translations';

interface MarkdownEditorToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (newContent: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  lang?: Language;
  showMediaInsert?: boolean;
  onInsertMedia?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const MarkdownEditorToolbar: React.FC<MarkdownEditorToolbarProps> = ({
  textareaRef,
  content,
  onChange,
  viewMode,
  setViewMode,
  lang = 'ru',
  showMediaInsert,
  onInsertMedia,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const t = translations[lang] || translations.ru;

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y on the textarea
  useEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          // Redo
          if (onRedo && canRedo) {
            e.preventDefault();
            onRedo();
          }
        } else {
          // Undo
          if (onUndo && canUndo) {
            e.preventDefault();
            onUndo();
          }
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        // Redo
        if (onRedo && canRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [textareaRef, onUndo, onRedo, canUndo, canRedo]);

  const insertSyntax = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      onChange(content + before + defaultText + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      onChange(content + '\n' + prefix);
      return;
    }

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  const isRu = lang === 'ru';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#1A1528] rounded-2xl border border-[#3d2b4f]/60 mb-2">
      {/* Format Action Buttons */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo Button */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1"
          title={`${t.undoBtn || (isRu ? 'Отменить' : 'Undo')} (Ctrl+Z)`}
        >
          <Undo2 size={15} />
        </button>

        {/* Redo Button */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1"
          title={`${t.redoBtn || (isRu ? 'Повторить' : 'Redo')} (Ctrl+Y / Ctrl+Shift+Z)`}
        >
          <Redo2 size={15} />
        </button>

        <div className="w-[1px] h-5 bg-[#3d2b4f] mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => insertSyntax('**', '**', isRu ? 'жирный текст' : 'bold text')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Жирный шрифт (**текст**)' : 'Bold (**text**)'}
        >
          <Bold size={15} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => insertSyntax('*', '*', isRu ? 'курсив' : 'italic text')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Курсив (*текст*)' : 'Italic (*text*)'}
        >
          <Italic size={15} />
        </button>

        <div className="w-[1px] h-5 bg-[#3d2b4f] mx-1" />

        {/* Headers */}
        <button
          type="button"
          onClick={() => insertLinePrefix('# ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer font-black text-xs"
          title={isRu ? 'Заголовок H1 (# Заголовок)' : 'Heading 1 (# Heading)'}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => insertLinePrefix('## ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer font-black text-xs"
          title={isRu ? 'Заголовок H2 (## Заголовок)' : 'Heading 2 (## Heading)'}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertLinePrefix('### ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer font-black text-xs"
          title={isRu ? 'Заголовок H3 (### Заголовок)' : 'Heading 3 (### Heading)'}
        >
          H3
        </button>

        <div className="w-[1px] h-5 bg-[#3d2b4f] mx-1" />

        {/* Quotes & Lists */}
        <button
          type="button"
          onClick={() => insertLinePrefix('> ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Цитата (> Цитата)' : 'Blockquote (> Quote)'}
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertLinePrefix('- ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Маркированный список (- Элемент)' : 'Bullet List (- Item)'}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertLinePrefix('1. ')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Нумерованный список (1. Элемент)' : 'Numbered List (1. Item)'}
        >
          <ListOrdered size={15} />
        </button>

        <div className="w-[1px] h-5 bg-[#3d2b4f] mx-1" />

        {/* Code */}
        <button
          type="button"
          onClick={() => insertSyntax('```\n', '\n```', isRu ? '// ваш код здесь' : '// your code here')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Блок кода (``` код ```)' : 'Code Block (``` code ```)'}
        >
          <Code size={15} />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={() => insertSyntax('[', '](https://example.com)', isRu ? 'Текст ссылки' : 'Link Title')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Ссылка ([текст](url))' : 'Link ([text](url))'}
        >
          <Link size={15} />
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={() => insertSyntax(
            '\n| ' + (isRu ? 'Параметр' : 'Feature') + ' | ' + (isRu ? 'Значение' : 'Value') + ' |\n| --- | --- |\n| ',
            ' | ... |\n',
            isRu ? 'Пример' : 'Sample'
          )}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Таблица (| Заголовок 1 | Заголовок 2 |)' : 'Table'}
        >
          <Table size={15} />
        </button>

        {/* Divider */}
        <button
          type="button"
          onClick={() => insertSyntax('\n---\n')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#ff4d4d]/20 transition-all cursor-pointer"
          title={isRu ? 'Разделительная линия (---)' : 'Horizontal Rule (---)'}
        >
          <Minus size={15} />
        </button>
      </div>

      {/* View Switcher (Edit / Preview / Split) */}
      <div className="flex items-center gap-1 bg-[#120c1b] p-1 rounded-xl border border-[#3d2b4f]/40">
        <button
          type="button"
          onClick={() => setViewMode('edit')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'edit'
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-md shadow-[#ff4d4d]/20'
              : 'text-white/50 hover:text-white'
          }`}
          title={isRu ? 'Редактировать разметку' : 'Edit Markdown'}
        >
          <Edit3 size={13} />
          <span>{isRu ? 'Редактор' : 'Write'}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('split')}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'split'
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-md shadow-[#ff4d4d]/20'
              : 'text-white/50 hover:text-white'
          }`}
          title={isRu ? 'Раздельный экран (Редактор + Просмотр)' : 'Split View'}
        >
          <Columns size={13} />
          <span>{isRu ? 'Сплит' : 'Split'}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'preview'
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-md shadow-[#ff4d4d]/20'
              : 'text-white/50 hover:text-white'
          }`}
          title={isRu ? 'Предпросмотр Markdown' : 'Preview'}
        >
          <Eye size={13} />
          <span>{isRu ? 'Просмотр' : 'Preview'}</span>
        </button>
      </div>
    </div>
  );
};
