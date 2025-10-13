import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  profile: {
    name: string;
    location: string;
    tagline: string;
    profileImage: string | null;
    twitterUrl: string | null;
    githubUrl: string | null;
    startDate: string;
  } | null;
  mmr?: number;
}

function formatMMR(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount}`;
}

export default function Hero({ profile, mmr = 0 }: HeroProps) {
  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <header className="text-center py-12 max-w-2xl mx-auto">
      <div className="mb-4">
        {profile.profileImage ? (
          <Image
            src={profile.profileImage}
            alt={profile.name}
            width={80}
            height={80}
            className="rounded-full mx-auto object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>

      <div className="flex items-center justify-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1 text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{profile.location}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>{formatMMR(mmr)}/Month</span>
        </div>
      </div>

      <p className="text-base text-gray-700 mb-3 max-w-md mx-auto">
        {profile.tagline}
      </p>

      <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs font-medium rounded-full mb-6">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
        Started {new Date(profile.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>

      <div className="flex justify-center gap-3 mb-8">
        {profile.twitterUrl && (
          <Link
            href={profile.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-black transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </Link>
        )}
        {profile.githubUrl && (
          <Link
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-black transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
