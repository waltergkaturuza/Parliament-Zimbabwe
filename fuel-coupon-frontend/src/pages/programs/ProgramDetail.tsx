// src/pages/programs/ProgramDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function ProgramDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Program Details</h1>
      <p>Program ID: {id}</p>
      {/* You will fetch and display detailed program information here */}
    </div>
  );
}

export default ProgramDetail;
