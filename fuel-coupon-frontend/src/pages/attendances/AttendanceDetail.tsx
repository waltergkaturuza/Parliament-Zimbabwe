// src/pages/attendances/AttendanceDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function AttendanceDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Attendance Details</h1>
      <p>Attendance ID: {id}</p>
      {/* You will fetch and display detailed attendance information here */}
    </div>
  );
}

export default AttendanceDetail;
