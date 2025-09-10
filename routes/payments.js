import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/verify', async (req, res) => {
  const { reference } = req.body;

  if (!reference) return res.status(400).json({ error: 'Reference is required' });

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = response.data;

    if (data.status && data.data.status === 'success') {
      // Payment was successful
      return res.json({ verified: true, details: data.data });
    } else {
      return res.status(400).json({ verified: false, error: 'Payment not successful' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error verifying payment with Paystack' });
  }
});

export default router;
