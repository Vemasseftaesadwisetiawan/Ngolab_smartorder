async function fetchMenu() {
  try {
    const res = await fetch('http://localhost:5000/api/menu', {
      headers: {
        'x-loop-prevent': 'true' // Mencegah loop rekursif jika ada
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Failed to fetch menu API, status:', res.status);
    }
  } catch (err) {
    console.error('❌ Error fetching menu API:', err.message);
  }
}

fetchMenu();
