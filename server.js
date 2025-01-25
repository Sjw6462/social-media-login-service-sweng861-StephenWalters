const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// Facebook OAuth callback with error handling
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
  try {
    res.redirect('/profile');
  } catch (error) {
    console.error('Facebook authentication error:', error);
    res.status(500).send('There was an error processing your Facebook login. Please try again later.');
  }
});

// LinkedIn OAuth callback with error handling
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/' }), function(req, res) {
  try {
    res.redirect('/profile');
  } catch (error) {
    console.error('LinkedIn authentication error:', error);
    res.status(500).send('There was an error processing your LinkedIn login. Please try again later.');
  }
});

// LinkedIn OAuth custom callback route
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
        console.error('Error exchanging authorization code for LinkedIn:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Facebook OAuth callback with user info retrieval
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

        // Fetch user info with the access token
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
