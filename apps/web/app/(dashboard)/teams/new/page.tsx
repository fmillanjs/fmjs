import { TeamForm } from '@/components/teams/team-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function NewTeamPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/teams" className="text-muted-foreground hover:text-foreground">
              <span className="text-sm font-medium">Teams</span>
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
              <span className="ml-4 text-sm font-medium text-muted-foreground">New Team</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create a New Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a team to collaborate with others on projects and tasks.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-card shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <TeamForm />
        </div>
      </div>
    </div>
  );
}
