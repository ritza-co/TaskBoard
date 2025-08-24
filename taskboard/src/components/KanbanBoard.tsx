import React, { useState, useEffect, useRef } from 'react';

interface Item {
  id: string;
  title: string;
  details: string;
  status: 'todo' | 'doing' | 'done';
}

interface KanbanBoardProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  handleDeleteItem: (id: string) => void;
  handleUpdateItemStatus: (id: string, status: 'todo' | 'doing' | 'done') => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ items, setItems, handleDeleteItem, handleUpdateItemStatus }) => {
  const [activeTab, setActiveTab] = useState<'todo' | 'doing' | 'done'>('todo');
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [newItems, setNewItems] = useState<Set<string>>(new Set());
  const previousItemsRef = useRef<Item[]>([]);

  // Track new items for animation
  useEffect(() => {
    const previousIds = new Set(previousItemsRef.current.map(item => item.id));
    const currentIds = new Set(items.map(item => item.id));
    
    // Find newly added items
    const newItemIds = items
      .filter(item => !previousIds.has(item.id))
      .map(item => item.id);
    
    if (newItemIds.length > 0) {
      setNewItems(new Set(newItemIds));
      // Remove from new items after animation completes
      setTimeout(() => {
        setNewItems(prev => {
          const updated = new Set(prev);
          newItemIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 500); // Match animation duration
    }
    
    previousItemsRef.current = items;
  }, [items]);

  // Enhanced delete handler with animation
  const handleDeleteWithAnimation = (itemId: string) => {
    setDeletingItems(prev => new Set([...prev, itemId]));
    
    // Delay actual deletion to allow animation to play
    setTimeout(() => {
      handleDeleteItem(itemId);
      setDeletingItems(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }, 300); // Match animation duration
  };

  // Helper functions for arrow navigation
  const canMoveLeft = (status: 'todo' | 'doing' | 'done') => {
    return status === 'doing' || status === 'done';
  };

  const canMoveRight = (status: 'todo' | 'doing' | 'done') => {
    return status === 'todo' || status === 'doing';
  };

  const getLeftStatus = (status: 'todo' | 'doing' | 'done'): 'todo' | 'doing' | 'done' => {
    if (status === 'doing') return 'todo';
    if (status === 'done') return 'doing';
    return status;
  };

  const getRightStatus = (status: 'todo' | 'doing' | 'done'): 'todo' | 'doing' | 'done' => {
    if (status === 'todo') return 'doing';
    if (status === 'doing') return 'done';
    return status;
  };

  // Simple move functions without janky animations
  const handleMoveLeft = (itemId: string, currentStatus: 'todo' | 'doing' | 'done') => {
    const newStatus = getLeftStatus(currentStatus);
    handleUpdateItemStatus(itemId, newStatus);
  };

  const handleMoveRight = (itemId: string, currentStatus: 'todo' | 'doing' | 'done') => {
    const newStatus = getRightStatus(currentStatus);
    handleUpdateItemStatus(itemId, newStatus);
  };
  
  const todoItems = items.filter(item => item.status === 'todo');
  const doingItems = items.filter(item => item.status === 'doing');
  const doneItems = items.filter(item => item.status === 'done');

  const columns = [
    { key: 'todo', label: 'To Do', items: todoItems, count: todoItems.length },
    { key: 'doing', label: 'Doing', items: doingItems, count: doingItems.length },
    { key: 'done', label: 'Done', items: doneItems, count: doneItems.length },
  ] as const;

  const renderItems = (itemsToRender: Item[]) => (
    <div className="space-y-3">
      {itemsToRender.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No tasks</p>
        </div>
      ) : (
        itemsToRender.map((item, index) => {
          const isNew = newItems.has(item.id);
          const isDeleting = deletingItems.has(item.id);
          
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isNew ? 'animate-task-appear' : 
                isDeleting ? 'animate-task-disappear' : 
                'animate-slide-down'
              }`}
              style={{ 
                animationDelay: isNew ? `${index * 150}ms` : isDeleting ? '0ms' : `${index * 50}ms`,
                pointerEvents: isDeleting ? 'none' : 'auto',
                opacity: isDeleting ? 0.7 : 1
              }}
            >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 pr-3">
                {item.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Left Arrow - Always visible when available */}
                {canMoveLeft(item.status) && (
                  <button 
                    onClick={() => handleMoveLeft(item.id, item.status)} 
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:scale-110 transition-all duration-200"
                    aria-label="Move left"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {/* Right Arrow - Always visible when available */}
                {canMoveRight(item.status) && (
                  <button 
                    onClick={() => handleMoveRight(item.id, item.status)} 
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:scale-110 transition-all duration-200"
                    aria-label="Move right"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                
                {/* Delete Button - Always visible */}
                <button 
                  onClick={() => handleDeleteWithAnimation(item.id)} 
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Delete task"
                  disabled={isDeleting}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Task Details */}
            {item.details && (
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {item.details}
              </p>
            )}
            
            {/* Task Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'todo' ? 'bg-gray-300' :
                  item.status === 'doing' ? 'bg-blue-400' : 'bg-green-400'
                }`} />
                <span className="text-xs font-medium text-gray-500 capitalize">
                  {item.status === 'todo' ? 'To Do' : item.status === 'doing' ? 'In Progress' : 'Complete'}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                #{item.id.slice(-4)}
              </span>
            </div>
          </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Mobile Tab Navigation */}
      <div className="block md:hidden mb-6">
        <div className="bg-gray-100 rounded-xl p-1 flex">
          {columns.map((column) => (
            <button
              key={column.key}
              onClick={() => setActiveTab(column.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === column.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                column.key === 'todo' ? 'bg-gray-400' :
                column.key === 'doing' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              <span>
                {column.key === 'todo' ? 'To Do' : column.key === 'doing' ? 'Progress' : 'Done'}
              </span>
              {column.count > 0 && (
                <span className="text-xs font-semibold text-gray-500 ml-1">
                  {column.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Single Column View */}
      <div className="block md:hidden">
        {columns.map((column) => (
          activeTab === column.key && (
            <div key={column.key} className="space-y-4">
              {renderItems(column.items)}
            </div>
          )
        ))}
      </div>

      {/* Desktop Three Column Layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {columns.map((column, columnIndex) => (
          <div key={column.key} className="bg-gray-50 rounded-2xl p-6 min-h-[600px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  column.key === 'todo' ? 'bg-gray-400' :
                  column.key === 'doing' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <h2 className="text-lg font-semibold text-gray-900">
                  {column.key === 'todo' ? 'To Do' : column.key === 'doing' ? 'In Progress' : 'Complete'}
                </h2>
              </div>
              <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full">
                {column.count}
              </span>
            </div>
            
            {/* Column Content */}
            <div className="space-y-4">
              {renderItems(column.items)}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default KanbanBoard;