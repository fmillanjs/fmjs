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
    <section className="py-16 border-t border-gray-200">
      <h2 className="text-3xl font-bold text-center mb-2">Daily Transparency Updates</h2>
      <p className="text-center text-gray-600 mb-12">I post 4 times a day: 6am, 11am, 2pm, and 6pm</p>

      <div className="max-w-2xl mx-auto space-y-5">
        {updates.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">First update coming soon...</h3>
            <p className="text-gray-600">Check back at 6am for the first daily update!</p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="flex gap-6 bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-black transition-all hover:-translate-y-1"
            >
              <div className="text-sm font-semibold text-blue-600 min-w-[70px] flex-shrink-0">
                {update.time}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 mb-2 leading-relaxed">{update.content}</p>
                <span className="text-xs text-gray-500">{update.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
