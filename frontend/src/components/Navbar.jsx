import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between">
      <h1 className="font-bold text-xl">ConceptCatch</h1>
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/generate">Generate Quiz</Link>
      </div>
    </nav>
  );
}
