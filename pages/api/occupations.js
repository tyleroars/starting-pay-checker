import data from '../../data/occupations.json';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  return res.status(200).json(data);
}
