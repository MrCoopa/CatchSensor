import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">
                TrapSensor
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Admin-Konsole
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Dashboard />
      </main>

      <footer className="bg-white mt-auto py-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TrapSensor Projekt. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}

export default App;
