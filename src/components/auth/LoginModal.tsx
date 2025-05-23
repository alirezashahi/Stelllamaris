import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-4">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-stellamaris-600 hover:bg-stellamaris-700 text-white',
                footerActionLink: 'text-stellamaris-600 hover:text-stellamaris-700',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border border-gray-300 focus:ring-stellamaris-500 focus:border-stellamaris-500',
                card: 'shadow-none border-0',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              }
            }}
            afterSignInUrl="/"
            afterSignUpUrl="/"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 