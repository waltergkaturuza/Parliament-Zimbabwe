// src/components/shared/AuditLogTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';

// Define the structure of an audit log entry based on your backend's AuditLog model
interface AuditLogEntry {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  action: string;
  timestamp: string; // ISO 8601 format from Django
  details: any; // Or a more specific type if you have consistent details
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

const StyledTableContainer = styled(TableContainer)({
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
});

const StyledTableCell = styled(TableCell)({
  '&:last-child': {
    paddingRight: 16,
  },
});

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p>No audit logs available.</p>;
  }

  return (
    <StyledTableContainer>
      <Table aria-label="audit log table" component={Paper}>
        <TableHead>
          <TableRow>
            <StyledTableCell>ID</StyledTableCell>
            <StyledTableCell>User</StyledTableCell>
            <StyledTableCell>Action</StyledTableCell>
            <StyledTableCell>Timestamp</StyledTableCell>
            <StyledTableCell>Details</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <StyledTableCell component="th" scope="row">
                {log.id}
              </StyledTableCell>
              <StyledTableCell>
                {log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.username})` : 'System'}
              </StyledTableCell>
              <StyledTableCell>{log.action}</StyledTableCell>
              <StyledTableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</StyledTableCell>
              <StyledTableCell>
                {log.details && Object.keys(log.details).length > 0 ? (
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                ) : (
                  'No details'
                )}
              </StyledTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

export default AuditLogTable;
