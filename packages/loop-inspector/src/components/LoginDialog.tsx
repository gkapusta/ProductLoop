import { useState } from 'react';
import { authClient } from '../lib/auth-client';

interface LoginDialogProps {
  onClose: () => void;
  onLoginSuccess: () => void;
  zIndex?: number;
}

export function LoginDialog({ onClose, onLoginSuccess, zIndex = 1000001 }: LoginDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        await authClient.signUp.email({
          email,
          password,
          name,
          ...(userType && { type: userType } as any),
        }, {
          onSuccess: () => {
            onLoginSuccess();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Sign up failed');
          },
        });
      } else {
        // Sign in
        await authClient.signIn.email({
          email,
          password,
        }, {
          onSuccess: () => {
            onLoginSuccess();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Sign in failed');
          },
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: zIndex - 1,
        }}
        onClick={onClose}
        data-loop-inspector-login-backdrop
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          maxWidth: '90vw',
          backgroundColor: '#1a202c',
          color: '#e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #2d3748',
          zIndex,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        data-loop-inspector-login-dialog
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #2d3748' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p style={{ fontSize: '14px', color: '#a0aec0', margin: 0 }}>
            {isSignUp ? 'Sign up to start creating requests' : 'Sign in to access Product Loop'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#7f1d1d',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                placeholder="John Doe"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}
              >
                Role
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select your role</option>
                <option value="product_manager">Product Manager</option>
                <option value="designer">Designer</option>
                <option value="developer">Developer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#4a5568' : '#9f7aea',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #2d3748',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <span style={{ color: '#a0aec0' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          {' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9f7aea',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </>
  );
}
