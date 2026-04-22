import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit2, Plus, Trash2, X, CheckSquare, LogIn, Flag } from 'lucide-react';
import { useTasks, Task } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { translations, Language } from '../../data/translations';

export const TasksSection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, loginWithGoogle } = useAuth();
  const { tasks, loading, addTask, updateTask, deleteTask, clearCompleted } = useTasks();
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const t = translations[lang] as any;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await addTask(newTaskText, newTaskPriority);
    setNewTaskText('');
    setNewTaskPriority('medium');
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTaskText('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTaskId && editTaskText.trim()) {
      await updateTask(editingTaskId, { text: editTaskText.trim() });
      setEditingTaskId(null);
      setEditTaskText('');
    }
  };

  const toggleComplete = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  const togglePriority = async (task: Task) => {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority || 'low');
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    await updateTask(task.id, { priority: nextPriority });
  };

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length > 0) {
      if (window.confirm(t.tasksClearConfirm || "Are you sure you want to delete all completed tasks?")) {
        await clearCompleted(completedTasks);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const getPriorityColor = (priority?: string) => {
    if (priority === 'high') return 'text-red-500';
    if (priority === 'medium') return 'text-yellow-500';
    return 'text-blue-500';
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#251c35] rounded-3xl p-8 border border-[#3d2b4f] shadow-2xl text-center">
        <h2 className="text-2xl font-black text-[#ff4d4d] uppercase mb-4 tracking-widest">{t.tasksTitle || "Tasks"}</h2>
        <p className="text-gray-400 mb-6">{t.tasksLoginPrompt || "Please sign in to manage your tasks."}</p>
        <button
          onClick={loginWithGoogle}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-colors border border-white/10"
        >
          <LogIn size={20} />
          {t.loginWithGoogle || "Login with Google"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl sm:text-3xl font-black text-[#ff4d4d] uppercase flex items-center gap-3 tracking-widest leading-none">
            <CheckSquare className="w-8 h-8" />
            {t.tasksTitle || "My Tasks"}
          </h2>
        </div>

        <div className="flex bg-[#15101e] rounded-xl p-1 border border-[#3d2b4f]">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-[#ff4d4d] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.tasksFilterAll || "All"}
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${filter === 'active' ? 'bg-[#ff4d4d] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.tasksFilterActive || "Active"}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${filter === 'completed' ? 'bg-[#ff4d4d] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.tasksFilterCompleted || "Done"}
          </button>
        </div>
      </div>

      <div className="bg-[#251c35] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-[#3d2b4f]">
        
        {totalCount > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>{completedCount} / {totalCount} {t.tasksProgress || "completed"}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#15101e] rounded-full overflow-hidden border border-[#3d2b4f]">
              <motion.div 
                className="h-full bg-[#ff4d4d]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 flex bg-[#15101e] border-2 border-[#3d2b4f] rounded-2xl overflow-hidden focus-within:border-[#ff4d4d] transition-colors">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={t.tasksAddPlaceholder || "Add a new task..."}
              className="flex-1 bg-transparent px-5 py-3 text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setNewTaskPriority(prev => prev === 'low' ? 'medium' : prev === 'medium' ? 'high' : 'low');
              }}
              className={`px-4 flex items-center justify-center border-l border-[#3d2b4f] hover:bg-white/5 transition-colors ${getPriorityColor(newTaskPriority)}`}
              title={t.tasksPriorityToggle || "Toggle Priority"}
            >
              <Flag size={20} className={newTaskPriority === 'high' ? 'fill-current' : ''} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="bg-[#ff4d4d] hover:bg-[#ff3333] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors shadow-lg shadow-[#ff4d4d]/20"
          >
            <Plus size={20} />
            <span>{t.tasksBtnAdd || "Add"}</span>
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">
            {t.tasksEmpty || "You don't have any tasks right now. Great job!"}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-colors ${
                    task.completed 
                      ? 'bg-[#1a1423] border-[#3d2b4f]/50 opacity-60' 
                      : 'bg-[#15101e] border-[#3d2b4f] hover:border-[#ff4d4d]/50'
                  }`}
                >
                  <button
                    onClick={() => toggleComplete(task)}
                    className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                      task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 text-transparent hover:border-[#ff4d4d]'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>

                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {editingTaskId === task.id ? (
                      <form onSubmit={handleEditSubmit} className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editTaskText}
                          onChange={(e) => setEditTaskText(e.target.value)}
                          className="flex-1 w-full bg-black/30 border border-[#ff4d4d]/50 rounded-lg px-3 py-1 text-white focus:outline-none"
                          autoFocus
                        />
                        <button type="submit" className="text-green-500 p-1 hover:bg-green-500/20 rounded shrink-0">
                          <Check size={18} />
                        </button>
                        <button type="button" onClick={cancelEditing} className="text-red-500 p-1 hover:bg-red-500/20 rounded shrink-0">
                          <X size={18} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className={`block truncate flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                          {task.text}
                        </span>
                        
                      </>
                    )}
                  </div>

                  {editingTaskId !== task.id && (
                    <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => togglePriority(task)}
                        className={`p-1.5 sm:p-2 rounded-lg transition-colors hover:bg-white/10 ${getPriorityColor(task.priority)}`}
                        title={t.tasksPriorityToggle || "Toggle Priority"}
                      >
                        <Flag size={16} className={task.priority === 'high' ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={() => startEditing(task)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title={t.tasksEdit || "Edit task"}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-lg transition-colors"
                        title={t.tasksDelete || "Delete task"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {completedCount > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-6 flex justify-center"
              >
                <button
                  onClick={handleClearCompleted}
                  className="text-sm font-bold text-gray-500 hover:text-[#ff4d4d] uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  {t.tasksClearCompleted || "Clear completed"}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
