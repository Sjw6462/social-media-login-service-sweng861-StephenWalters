const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const passport = require('passport');

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

const fetch = require('node-fetch'); // If you're using Node.js
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const redirectUri = '<YOUR_REDIRECT_URI>';

app.get('/linkedin/callback', async (req, res) => {
    const authorizationCode = req.query.code;

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch user info with the access token
        const apiUrl = "https://api.linkedin.com/v2/me";
        const emailUrl = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";

        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        // Fetch user profile
        const profileResponse = await fetch(apiUrl, { headers });
        const profileData = await profileResponse.json();

        // Fetch user email
        const emailResponse = await fetch(emailUrl, { headers });
        const emailData = await emailResponse.json();

        // Display or save user info
        console.log(`Welcome ${profileData.localizedFirstName} ${profileData.localizedLastName}! Your email is ${emailData.elements[0]['handle~'].emailAddress}`);
        
        res.send(`Welcome ${profileData.localizedFirstName} ${profileData.localizedLastName}! Your email is ${emailData.elements[0]['handle~'].emailAddress}`);
    } catch (error) {
        console.error("Error during LinkedIn login:", error);
        res.status(500).send("Login failed");
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
