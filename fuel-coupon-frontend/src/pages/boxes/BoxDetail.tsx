// src/pages/boxes/BoxDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function BoxDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Box Details</h1>
      <p>Box ID: {id}</p>
      {/* You will fetch and display detailed box information here */}
    </div>
  );
}

export default BoxDetail;
