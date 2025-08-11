// src/pages/main-center/BookDispatchEnhancedPage.tsx
import { FC } from 'react';
import { Card } from 'antd';
import BookDispatchManagementEnhanced from './components/BookDispatchManagementEnhanced';

const BookDispatchEnhancedPage: FC = () => {
  return (
    <div className="book-dispatch-enhanced-page">
      <BookDispatchManagementEnhanced />
    </div>
  );
};

export default BookDispatchEnhancedPage;
