// src/pages/components/forms/AttendanceForm.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, FormControlLabel, Checkbox } from '@mui/material';
// You might need a Select/Dropdown for User and Program fields, fetching options from API
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// Import API client (e.g., axios) or custom hook here
// import api from '../../../api/api'; // Example API client

interface AttendanceFormProps {
  // You might pass props like lists of users and programs relevant to the current user/sub-center
}

const AttendanceForm: React.FC<AttendanceFormProps> = (props) => {
  const [userId, setUserId] = useState(''); // Or use an object/dropdown value
  const [programId, setProgramId] = useState(''); // Or use an object/dropdown value
  const [attended, setAttended] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Recording attendance:', { userId, programId, attended, notes });

    // Prepare data for the API call
    const formData = {
      user: parseInt(userId, 10), // Assuming userId is an integer
      program: parseInt(programId, 10), // Assuming programId is an integer
      attended: attended,
      signed_at: new Date().toISOString(), // Or get from a date picker
      notes: notes,
    };

     // Ensure user and program are selected
    if (!formData.user || !formData.program) {
        console.error("User and Program are required.");
        // Show error message to user
        return;
    }

    console.log('API Payload:', formData);


    // --- Add your API call logic here ---
    /*
    try {
      const response = await api.post('/api/v1/attendance/', formData); // Example API endpoint
      console.log('Attendance recorded successfully:', response.data);
      // Handle success (e.g., show a success message, clear form)
      setUserId('');
      setProgramId('');
      setAttended(false);
      setNotes('');
    } catch (error) {
      console.error('Recording attendance failed:', error);
      // Handle error (e.g., show an error message)
    }
    */
    // --- End API call logic ---
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Record Attendance</Typography>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextField
            fullWidth
            label="User ID (Beneficiary)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            type="number"
            required
          />
          <TextField
            fullWidth
            label="Program ID"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            type="number"
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={attended}
                onChange={(e) => setAttended(e.target.checked)}
                color="primary"
              />
            }
            label="Attended"
          />
          <TextField
            fullWidth
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Save Attendance
          </Button>
        </div>
      </form>
    </Paper>
  );
};

export default AttendanceForm;
