export default async function handler(req, res) {
  console.log("METHOD RECEIVED:", req.method);

  return res.status(200).json({
    success: true,
    method: req.method,
  });
}