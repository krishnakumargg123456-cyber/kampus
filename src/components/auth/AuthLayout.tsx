import React from 'react';
import { AuthBrandPanel } from './AuthBrandPanel';

interface AuthLayoutProps {
  children: React.ReactNode;
  brandQuote?: string;
  brandAuthor?: string;
  highlightTag?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  brandQuote,
  brandAuthor,
  highlightTag,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex selection:bg-blue-600 selection:text-white antialiased">
      {/* Left Column: Brand & Ecosystem Experience (Desktop) */}
      <AuthBrandPanel
        quote={brandQuote}
        author={brandAuthor}
        highlightTag={highlightTag}
      />

      {/* Right Column: Clean Authentication Canvas */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 sm:py-16 px-4 sm:px-6 lg:px-12 overflow-y-auto">
        <div className="w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};
