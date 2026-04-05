import { getRedis } from '../../lib/redis';

export default async function handler(req, res) {
  try {
    const redis = getRedis();
    const raw = await redis.get('spc:data');

    if (!raw) {
      return res.status(503).json({
        error: 'Data not yet loaded. Run the GitHub Action to populate data.',
      });
    }

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
