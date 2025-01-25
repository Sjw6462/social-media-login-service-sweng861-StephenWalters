const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// LinkedIn OAuth callback
app.get('/linkedin/callback', async (req, res) => {
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        // Step 1: Exchange authorization code for access token
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Step 2: Fetch user profile data
        const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const profileData = profileResponse.data;

        // Step 3: Fetch user email
        const emailResponse = await axios.get(
            'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const emailData = emailResponse.data;
        const emailAddress = emailData.elements[0]['handle~'].emailAddress;

        // Respond with user data
        res.json({
            platform: 'LinkedIn',
            profile: {
                firstName: profileData.localizedFirstName,
                lastName: profileData.localizedLastName,
                email: emailAddress,
            },
        });
    } catch (error) {
        console.error('Error during LinkedIn login:', error.response?.data || error.message);
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
        const response = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_CLIENT_ID,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET,
                code: authorizationCode,
            },
        });

        const accessToken = response.data.access_token;

        // Now use this access token to fetch user info
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: accessToken,
                fields: 'id,name,email,picture',
            },
        });

        // Send user data back to frontend
        res.json({
            platform: 'Facebook',
            profile: userResponse.data,
        });
    } catch (error) {
        console.error('Error exchanging authorization code for Facebook:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
