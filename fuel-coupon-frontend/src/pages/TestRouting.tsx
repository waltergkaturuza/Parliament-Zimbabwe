// Simple test component
const TestRouting = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🎉 Routing is Working!</h1>
      <p>If you can see this, the basic routing system is functional.</p>
      <p>Current path: {window.location.pathname}</p>
    </div>
  );
};

export default TestRouting;
