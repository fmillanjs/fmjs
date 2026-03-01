import { LoginForm } from '@/components/auth/login-form';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/session';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI SDR</h1>
          <p className="text-sm text-muted-foreground mt-1">Lead Intelligence Platform</p>
        </div>

        {/* Demo credentials box — AUTH-02 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Demo Credentials
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Email: <code className="font-mono">{DEMO_EMAIL}</code>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Password: <code className="font-mono">{DEMO_PASSWORD}</code>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
