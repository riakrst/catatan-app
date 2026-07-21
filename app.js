const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const URI = process.env.MONGO_URL || 'mongodb://localhost:27017';

app.use(express.json());
let notes = null; // diisi setelah DB tersambung

app.get('/health', (req, res) => res.json({ status: 'ok', db: notes ? 'connected' : 'disconnected' }));

// GET — lihat semua catatan
app.get('/notes', async (req, res) => {
  if (!notes) return res.status(503).json({ error: 'DB belum siap' });
  res.json(await notes.find().sort({ _id: -1 }).toArray());
});

// INSERT — tambah catatan baru
app.post('/notes', async (req, res) => {
  if (!notes) return res.status(503).json({ error: 'DB belum siap' });
  if (!req.body.text) return res.status(400).json({ error: 'text kosong' });
  const r = await notes.insertOne({ text: req.body.text, at: new Date() });
  res.status(201).json({ id: r.insertedId, text: req.body.text });
});

// EDIT — ubah catatan yang sudah ada
app.put('/notes/:id', async (req, res) => {
  const { id } = req.params; // dari URL
  const { text } = req.body; // dari body JSON

  if (!notes) return res.status(503).json({ error: 'DB belum siap' });
  if (!text) return res.status(400).json({ error: 'text kosong' });
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'id tidak valid' });

  const r = await notes.updateOne(
    { _id: new ObjectId(id) }, // cari yang mana
    { $set: { text, at: new Date() } },
  ); // ubah apanya

  if (r.matchedCount === 0) return res.status(404).json({ error: 'catatan tidak ada' });
  res.json({ id, text });
});

// Server menyala DULU — tidak menunggu database
app.listen(PORT, '0.0.0.0', () => console.log('Jalan di port ' + PORT));

// Database menyusul, dengan retry
(async function connect() {
  try {
    const client = await MongoClient.connect(URI);
    notes = client.db('catatan').collection('notes');
    console.log('MongoDB tersambung');
  } catch (e) {
    console.error('Gagal connect MongoDB:');
    console.error(e);
    console.log('MongoDB belum siap, retry 3 detik...');
    setTimeout(connect, 3000);
  }
})();
