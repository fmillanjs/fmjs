export default function Footer() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <footer className="text-center py-8 border-t border-gray-200">
      <p className="text-gray-600 text-xs">Built with brutal honesty. Updated daily.</p>
      <p className="text-gray-400 text-xs mt-1">{currentDate}</p>
    </footer>
  );
}
