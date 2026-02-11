import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableFile({ fileObj, removeFile, rotateFile }) {
  // These variables are provided by dnd-kit to handle the movement
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: fileObj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0, // Make sure dragging item stays on top
    opacity: isDragging ? 0.5 : 1, // Visual feedback
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-3 shadow-sm group"
    >
      {/* 1. THE DRAG HANDLE (The dots icon) */}
      {/* We only put {listeners} here so users can only drag by the handle, not the buttons */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab p-2 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>

      {/* 2. THE CONTENT (Thumbnail + Name) */}
      <div className="flex items-center space-x-4 min-w-0 flex-1 px-2">
        <div className="w-10 h-14 bg-gray-100 rounded border shrink-0 overflow-hidden">
          {fileObj.thumbnail && (
            <img 
              src={fileObj.thumbnail} 
              className="w-full h-full object-cover" 
              style={{ transform: `rotate(${fileObj.rotation}deg)` }}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-700 truncate">
            {fileObj.file.name}
          </span>
          <span className="text-xs text-gray-400">
            {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      </div>

      {/* 3. THE ACTIONS (Rotate + Trash) */}
      <div className="flex items-center space-x-1 shrink-0">
        <button 
          onClick={() => rotateFile(fileObj.id)}
          className="p-2 text-orange-500 hover:bg-orange-50 rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
        <button 
          onClick={() => removeFile(fileObj.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  );
}