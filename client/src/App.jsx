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
  const [customName, setCustomName] = useState("merged_document");

  const processFiles = async (newFiles) => {
    for (const file of newFiles) {
      const id = Math.random().toString(36).substr(2, 9);
      setFiles(prev => [...prev, { id, file, thumbnail: null, rotation: 0 }]);

      const formData = new FormData();
      formData.append('pdf', file);
      try {
        const res = await axios.post('http://localhost:5000/get-thumbnail', formData);
        setFiles(prev => prev.map(f => f.id === id ? { ...f, thumbnail: res.data.thumbnail } : f));
      } catch (err) { console.error(err); }
    }
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleMerge = async () => {
    if (files.length < 2) return alert("Select at least 2 PDFs!");

    setLoading(true); // Start spinning

    const formData = new FormData();
    files.forEach((fileObj) => {
      formData.append('pdfs', fileObj.file);
    });

    const rotationData = files.map(f => f.rotation || 0);
    formData.append('rotations', JSON.stringify(rotationData));

    try {
      const response = await axios.post('http://localhost:5000/merge', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${customName || 'merged_document'}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Cleanup the link and the URL object
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Merge failed", error);
      alert("Something went wrong during merging. Check the server console.");
    } finally {
      // THIS IS THE FIX: This runs no matter what happens above
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
    const pdfs = [...e.dataTransfer.files].filter(f => f.type === "application/pdf");
    processFiles(pdfs);
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

        {files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col md:flex-row items-end gap-4">

              {/* Filename Input (Left Side) */}
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Output Filename
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 pr-12 text-sm font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
                    placeholder="Name your file..."
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-mono select-none">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Merge Button (Right Side) */}
              <button
                onClick={handleMerge}
                disabled={loading || files.length < 2}
                className={`flex-none h-11.5 px-8 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center min-w-40
          ${loading || files.length < 2
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:scale-95'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                    Merging...
                  </>
                ) : (
                  "Merge PDF"
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      <footer className="mt-auto text-gray-400 text-sm">
        Built with Node.js + Python
      </footer>
    </div>
  );
}

export default App;