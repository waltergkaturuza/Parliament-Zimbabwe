import React from 'react';
import { useRouteError } from 'react-router-dom';

// Type guard for Error objects
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard for HTTP error responses
function isHttpError(error: unknown): error is { 
  statusText?: string; 
  status?: number; 
  data?: unknown 
} {
  return typeof error === 'object' && error !== null && 
         ('statusText' in error || 'status' in error);
}

export default function ErrorPage() {
  const error = useRouteError();
  
  // Handle null/undefined errors
  if (!error) {
    return (
      <div className="error-container">
        <h1>Unknown Error Occurred</h1>
        <p>No error details available</p>
      </div>
    );
  }

  // Handle Error objects
  if (isError(error)) {
    return (
      <div className="error-container">
        <h1>Error: {error.message}</h1>
        {process.env.NODE_ENV === 'development' && (
          <>
            <p>Stack trace:</p>
            <pre className="error-stack">{error.stack}</pre>
          </>
        )}
      </div>
    );
  }

  // Handle HTTP error responses
  if (isHttpError(error)) {
    return (
      <div className="error-container">
        <h1>Unexpected Error</h1>
        <p>Status: {error.statusText || error.status || 'Unknown'}</p>
        {error.data && typeof error.data === 'object' ? (
          <div>
            <p>Error details:</p>
            <pre className="error-data">
              {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    );
  }

  // Fallback for any other error type
  return (
    <div className="error-container">
      <h1>Unknown Error Type</h1>
      <p>Received error of unexpected format:</p>
      <pre className="error-data">
        {JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
