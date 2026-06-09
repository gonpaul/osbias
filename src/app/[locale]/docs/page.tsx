'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

export default function DocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(err => console.error('Failed to load API spec:', err));
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading API Documentation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center pb-40">
      <div className="max-w-[900px] w-full flex flex-col rounded-xl p-8 shadow-lg bg-(--westar)">
        <div className="swagger-ui-wrapper rounded-lg overflow-hidden p-0 bg-transparent">
          <SwaggerUI spec={spec}/>
        </div>
      </div>
    </div>
  );
}
