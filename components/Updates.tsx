interface Update {
  id: number;
  time: string;
  content: string;
  date: string;
  createdAt: Date | null;
}

interface UpdatesProps {
  updates: Update[];
}

export default function Updates({ updates }: UpdatesProps) {
  return (
    <section className="py-12 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Daily Updates</h2>
      <p className="text-gray-600 text-sm mb-6">Raw, unfiltered progress</p>

      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-base font-semibold mb-1">No updates yet</h3>
            <p className="text-gray-600 text-sm">First update coming at 6am...</p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded">
                    {update.time}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed mb-1">{update.content}</p>
                  <span className="text-xs text-gray-500">{update.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
