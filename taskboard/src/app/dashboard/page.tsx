"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import ChatComponent from '@/components/ChatPlaceholder';
import TaskModal from '@/components/TaskModal';

interface Item {
  id: string;
  title: string;
  details: string;
  status: 'todo' | 'doing' | 'done';
}

const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchItems = async () => {
    const userIdFromStorage = localStorage.getItem('userId');
    if (!userIdFromStorage) {
      router.push('/login');
      return;
    }
    setUserId(userIdFromStorage);

    try {
      const response = await fetch(`/api/items?userId=${encodeURIComponent(userIdFromStorage)}`);

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to fetch items');
      }
    } catch (err) {
      console.error('Fetch items error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [router]);

  const handleCreateItem = async (title: string, details: string) => {
    setError(null);
    setIsCreating(true);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/items?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, details, status: 'todo' }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchItems(); // Re-fetch items to update the board
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to create item');
      }
    } catch (err) {
      console.error('Create item error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/items/${id}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchItems(); // Re-fetch items to update the board
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Delete item error:', err);
      setError('An unexpected error occurred.');
    }
  };

  const handleUpdateItemStatus = async (id: string, newStatus: 'todo' | 'doing' | 'done') => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/items/${id}?userId=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchItems(); // Re-fetch items to update the board
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to update item status');
      }
    } catch (err) {
      console.error('Update item status error:', err);
      setError('An unexpected error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mono-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-mono-200 border-t-mono-900 rounded-full animate-spin"></div>
          <p className="text-mono-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mono-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 glass-button rounded-lg text-mono-black hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: items.length,
    todo: items.filter(item => item.status === 'todo').length,
    doing: items.filter(item => item.status === 'doing').length,
    done: items.filter(item => item.status === 'done').length,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">TaskBoard</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium">{taskStats.total} tasks</span>
                <span className="font-medium">{taskStats.done} completed</span>
                {taskStats.total > 0 && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium text-xs">
                    {Math.round((taskStats.done / taskStats.total) * 100)}% complete
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Task Button */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Tasks</h2>
              <p className="text-gray-500 text-sm mt-1">Organize and manage your work</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 sm:w-auto w-full justify-center"
              aria-label="Create new task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="mb-8">
          <KanbanBoard 
            items={items} 
            setItems={setItems} 
            handleDeleteItem={handleDeleteItem} 
            handleUpdateItemStatus={handleUpdateItemStatus} 
          />
        </div>

        {/* Floating Chat Component */}
        {userId && <ChatComponent userId={userId} />}

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateItem}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
};

export default DashboardPage;