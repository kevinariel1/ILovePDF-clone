import { Link } from 'react-router-dom';

export default function Home() {
  const tools = [
    { 
      name: "Merge PDF", 
      desc: "Combine multiple PDFs into one.", 
      path: "/merge", 
      icon: "📄➕", 
      color: "hover:border-red-500" 
    },
    { 
      name: "Split PDF", 
      desc: "Extract pages or save every page as a separate PDF.", 
      path: "/split", 
      icon: "✂️", 
      color: "hover:border-blue-500" 
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Choose a tool</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Link 
            key={tool.name} 
            to={tool.path}
            className={`p-8 bg-white border-2 border-transparent rounded-2xl shadow-sm transition-all transform hover:-translate-y-1 hover:shadow-xl ${tool.color}`}
          >
            <div className="text-4xl mb-4">{tool.icon}</div>
            <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
            <p className="text-gray-500 text-sm">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}