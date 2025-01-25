const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for cross-origin requests

const PORT = 3000;

// LinkedIn OAuth callback
app.get('/linkedin/callback', async (req, res) => {
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            },
        });

        const accessToken = response.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error('Error exchanging authorization code for LinkedIn:', error.response?.data || error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Facebook OAuth callback
app.get('/facebook/callback', async (req, res) => {
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        const response = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_CLIENT_ID,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                code: authorizationCode,
            },
        });

        const accessToken = response.data.access_token;

        // Fetch user info using the access token
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: accessToken,
                fields: 'id,name,email,picture',
            },
        });

        res.json({
            platform: 'Facebook',
            profile: userResponse.data,
        });
    } catch (error) {
        console.error('Error exchanging authorization code for Facebook:', error.response?.data || error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Single app.listen call
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
