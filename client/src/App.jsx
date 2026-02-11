import React, { useState } from 'react';
import axios from 'axios';
import { arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableFile } from '../components/SortableFile.jsx';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    for (const file of selectedFiles) {
      const id = Math.random().toString(36).substr(2, 9);

      // Add file with a loading state first
      setFiles(prev => [...prev, { id, file, thumbnail: null, rotation: 0 }]);

      // Ask Node for a thumbnail
      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const res = await axios.post('http://localhost:5000/get-thumbnail', formData);

        // Update that specific file with its new thumbnail
        setFiles(prev => prev.map(f =>
          f.id === id ? { ...f, thumbnail: res.data.thumbnail } : f
        ));
      } catch (err) {
        console.error("Thumbnail failed", err);
      }
    }
  };

  const handleMerge = async () => {

    if (files.length < 2) return alert("Select at least 2 PDFs!");
    const formData = new FormData();

    // Add files
    files.forEach((fileObj) => {
      formData.append('pdfs', fileObj.file);
    });

    const rotationData = files.map(f => f.rotation || 0);
    formData.append('rotations', JSON.stringify(rotationData));

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/merge', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Something went wrong during merging.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // Get files from the event
    const droppedFiles = [...e.dataTransfer.files];

    // Filter for PDFs only
    const pdfs = droppedFiles.filter(file => file.type === "application/pdf");

    if (pdfs.length > 0) {
      setFiles((prev) => [...prev, ...pdfs]);
    } else {
      alert("Please drop PDF files only!");
    }
  };

  const removeFile = (id) => {
    setFiles((prevFiles) => {
      // 1. Find the file to be removed
      const fileToRemove = prevFiles.find(f => f.id === id);

      // 2. Revoke the URL to prevent memory leaks if you used createObjectURL
      if (fileToRemove?.preview && fileToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      // 3. Filter it out
      return prevFiles.filter((file) => file.id !== id);
    });
  };

  const rotateFile = (id) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
    ));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= newFiles.length) return;
    [newFiles[index], newFiles[nextIndex]] = [newFiles[nextIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Merge <span className="text-red-600">PDF</span>
        </h1>
        <p className="text-gray-600">Combine multiple PDF files into one in seconds.</p>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer 
    ${isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-red-400'}`}
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer text-center">
            <div className="text-4xl mb-2">📄</div>
            <span className="text-sm font-medium text-gray-700">Click to upload or drag and drop</span>
            <p className="text-xs text-gray-500 mt-1">PDF files only</p>
          </label>
        </div>

        {/* File List Area */}
        {files.length > 0 && (
          <div className="mt-6 w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Selected Files ({files.length}):</h3>
              <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline font-medium">
                Clear All
              </button>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {files.map((file) => (
                    <SortableFile
                      key={file.id}
                      fileObj={file}
                      removeFile={removeFile}
                      rotateFile={rotateFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleMerge}
          disabled={loading || files.length < 2}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md
            ${loading || files.length < 2
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:transform active:scale-95'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
              Merging...
            </span>
          ) : "Merge PDF"}
        </button>
      </div>

      <footer className="mt-auto text-gray-400 text-sm">
        Built with Node.js + Python
      </footer>
    </div>
  );
}

export default App;