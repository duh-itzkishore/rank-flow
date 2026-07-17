import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/app/search")({
  component: SearchStub,
});

function SearchStub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
        <Search className="w-8 h-8 text-indigo-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-white">Global Search</h1>
        <p className="text-white/40 mt-2 max-w-md mx-auto">
          Global search functionality is coming soon.
        </p>
      </div>
    </div>
  );
}
