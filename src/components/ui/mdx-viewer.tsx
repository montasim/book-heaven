'use client';

import React from 'react';
import { MDXViewer as MDXViewerComp } from 'mdx-craft';

interface MDXViewerProps {
  content: string;
  className?: string;
}

export function MDXViewer({ content, className = '' }: MDXViewerProps) {
  if (!content) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mdx-content [&_ul]:ml-6 [&_ol]:ml-6 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_ul_ul]:ml-4 [&_ul_ol]:ml-4 [&_ol_ul]:ml-4 [&_ol_ol]:ml-4">
        <MDXViewerComp source={content} />
      </div>
    </div>
  );
}

export default MDXViewer;