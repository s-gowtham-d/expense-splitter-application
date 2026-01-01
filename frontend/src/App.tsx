import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Expense Splitter
        </h1>
        <p className="text-gray-600 mb-8">
          Split expenses easily with friends and family
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}

export default App;
