// src/pages/books/BookDetail.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

function BookDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Book Details</h1>
      <p>Book ID: {id}</p>
      {/* You will fetch and display detailed book information here */}
    </div>
  );
}

export default BookDetail;
