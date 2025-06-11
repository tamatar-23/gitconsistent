
import React from 'react';

interface GitConsistentLogoProps extends React.SVGProps<SVGSVGElement> {
  // className prop is implicitly handled by SVGProps
}

export const GitConsistentLogo: React.FC<GitConsistentLogoProps> = (props) => {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Spread props to allow className, width, height, etc.
    >
      {/* Outer Border - slightly rounded */}
      <rect x="2" y="2" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="2" />

      {/* Inner Grid Lines */}
      <line x1="2" y1="12" x2="42" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="2" x2="12" y2="42" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="2" x2="22" y2="42" stroke="currentColor" strokeWidth="1.5" />
      <line x1="32" y1="2" x2="32" y2="42" stroke="currentColor" strokeWidth="1.5" />

      {/* Filled Cells (each content cell is 10x10, grid starts at 2,2) */}
      {/* R1C3 */}
      <rect x="22" y="2" width="10" height="10" fill="currentColor" />
      {/* R2C2 */}
      <rect x="12" y="12" width="10" height="10" fill="currentColor" />
      {/* R3C4 */}
      <rect x="32" y="22" width="10" height="10" fill="currentColor" />
      {/* R4C1 */}
      <rect x="2" y="32" width="10" height="10" fill="currentColor" />
    </svg>
  );
};
