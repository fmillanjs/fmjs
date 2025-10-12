export default function Footer() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <footer className="text-center py-12 text-gray-600 text-sm">
      <p>Built with transparency. Updated daily.</p>
      <p className="text-xs mt-2 opacity-70">Last updated: {currentDate}</p>
    </footer>
  );
}
