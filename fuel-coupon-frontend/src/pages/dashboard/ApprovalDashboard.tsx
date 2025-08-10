// src/pages/dashboard/ApprovalDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api';

interface ApprovalRequest {
  id: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  // Add other relevant properties
}

const ApprovalDashboard = () => {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !['MAIN_CENTER_APPROVER', 'SUB_CENTER_APPROVER'].includes(user?.role || '')) {
      navigate('/unauthorized'); // Redirect if not an approver
      return;
    }

    const fetchApprovalData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/approvals/');
        const data: ApprovalRequest[] = response.data;
        setApprovalRequests(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalData();
  }, [isAuthenticated, navigate, user?.role]); // Dependencies to control the effect

  const handleApprove = (requestId: number) => {
    // Implement your logic to approve the request
    console.log(`Request ${requestId} approved`);
    // After approval, you might want to refetch the data
  };

  const handleReject = (requestId: number) => {
    // Implement your logic to reject the request
    console.log(`Request ${requestId} rejected`);
    // After rejection, you might want to refetch the data
  };

  if (loading) {
    return <div>Loading approval requests...</div>;
  }

  if (error) {
    return <div>Error loading approval requests: {error}</div>;
  }

  return (
    <div>
      <h1>Approval Dashboard</h1>
      {approvalRequests.length > 0 ? (
        <ul>
          {approvalRequests.map((request) => (
            <li key={request.id}>
              {request.description} - Status: {request.status}
              {request.status === 'pending' && (
                <>
                  <button onClick={() => handleApprove(request.id)}>Approve</button>
                  <button onClick={() => handleReject(request.id)}>Reject</button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No approval requests found.</p>
      )}
    </div>
  );
};

export default ApprovalDashboard;
