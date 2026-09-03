async function testDelete() {
  try {
    const res = await fetch('http://localhost:5000/api/menu/15', { method: 'DELETE' });
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testDelete();
