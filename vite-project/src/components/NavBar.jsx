export default function Navbar() {
  return (
    <header className="flex items-center justify-between p-4 bg-indigo-800">
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Logo" className="w-6 h-6" />
        <h1 className="text-xl font-bold">SegnoVivo</h1>
      </div>
      <nav className="space-x-6">
        <a href="#" className="text-green-400 border-b-2 border-green-400 pb-1">Home</a>
        <a href="#" className="hover:text-green-300">Translate</a>
        <a href="#" className="hover:text-green-300">About</a>
      </nav>
      <div>
        <img src="/menu.svg" alt="Menu" className="w-5 h-5" />
      </div>
    </header>
  );
}
