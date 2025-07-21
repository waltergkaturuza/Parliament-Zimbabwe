// src/pages/handovers/HandoverDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function HandoverDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Handover Details</h1>
      <p>Handover ID: {id}</p>
      {/* You will fetch and display detailed handover information here */}
    </div>
  );
}

export default HandoverDetail;
