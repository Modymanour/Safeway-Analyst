import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">That page is not part of the Safe Way analytics dashboard.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Return to analytics</Link>
      </div>
    </div>
  );
}
