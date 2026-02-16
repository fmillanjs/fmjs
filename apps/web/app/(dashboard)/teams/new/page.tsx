import { TeamForm } from '@/components/teams/team-form';
import Link from 'next/link';

export default function NewTeamPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/teams" className="text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:text-gray-300">
              <span className="text-sm font-medium">Teams</span>
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 h-5 w-5 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-600 dark:text-gray-300">New Team</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a New Team</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Set up a team to collaborate with others on projects and tasks.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <TeamForm />
        </div>
      </div>
    </div>
  );
}
