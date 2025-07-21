// src/pages/Programs.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Programs = () => {
  // Replace this with actual program data fetching and rendering
  const programs = [
    { id: 1, name: 'Program A' },
    { id: 2, name: 'Program B' },
    { id: 3, name: 'Program C' },
  ];

  return (
    <div>
      <h1>Programs</h1>
      <ul>
        {programs.map((program) => (
          <li key={program.id}>
            <Link to={`/programs/${program.id}`}>{program.name}</Link>
          </li>
        ))}
      </ul>
      {/* Add functionality to create new programs here */}
    </div>
  );
};

export default Programs;
