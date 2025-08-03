const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Changed this line

// Middleware
app.use(cors());
app.use(express.json());

// Root route - ADD THIS
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fundraiser API Server is running!',
    endpoints: {
      health: '/health',
      generateWhy: 'POST /api/generate-why'
    }
  });
});

// Generate Why endpoint
app.post('/api/generate-why', async (req, res) => {
  try {
    const { orgType, orgName, fundraiserType, clientInfo } = req.body;

    if (!orgType || !orgName || !fundraiserType || !clientInfo) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create a more detailed prompt for Gemini
    const prompt = `You are writing a formal peice of text, with 2 or 3 segments of text totalling 100-150 words. The peice of text serves as a "Why" statement for a fundraising campaign, telling donors what the organisation (of which you will receive details about) is fundraising for.
    the segments will be seperated by a line. the first segment will state what type of fundraiser it is. if the type is event - talk about how the school is running an event etc, if it is product say they are selling a product to... 
    for the second segment can you talk about what the money is for - utilise cliet info for this. and for the third segment talk about how that will benefit the students/people of the organisation, as well as thanking poeple for their generosity. 

Organization Type: ${orgType}
Organization Name: ${orgName}
Fundraiser Type: ${fundraiserType}
Client Information on why the fundraiser is taking place: ${clientInfo}

You will mimick the writing style of the below examples. START OF EXAMPLES:

Who: Te Awamutu Intermediate Netball, Event: Product - Frozen Cookies
Why: We are fundraising to send our netball team to AIMS games

Te Awamutu Intermediate Netball is selling delicious frozen cookie dough to fundraiser for our team's trip to the Zespri AIMS Games 2025 in Tauranga this September.

Funds raised will help cover the costs of our week long stay and give our players the chance to compete, learn, and create unforgettable memories at this fantastic national event. 

This sweet cookie dough is perfect to keep in the freezer for quick, tasty baking and every purchase helps get our team one step closer to the games. 

Thank you for your support!

Who: Greymouth High School, Event: Product-  Pies and Savouries, 
Why: We are fundraising to send our sports teams to tournaments

Greymouth High School is selling delicious frozen pies and savouries from Luv a Pie to raise funds for our sports teams heading to tournaments.

Funds raised will help reduce costs for students, making it easier for them to travel and compete, giving them the chance to represent our school, build skills, and create lasting memories.

These hearty pies and savouries are perfect for family meals or quick snacks and every purchase helps get our teams one step closer to tournament.

Thank you for supporting Greymouth High School!

Who: Northcross Intermediate School, Event: Fun Run, 
Why: We are fundraising in our annual 3km loop fun run for continued enhancement of the school 

The Annual Northcross School Fun Run will be held on Friday 22nd August.

This much-anticipated event brings the entire school community together and provides an opportunity to raise funds for new technology, equipment, and enriching learning experiences that support both our classroom and sports programmes.

Every student will be participating by completing a 3km course, setting their own personal target for the day.

Students will be seeking online sponsorship for their participation, with all funds raised contributing to the continued enhancement of our school and its outstanding learning environment.

Thank you for supporting Northcross Intermediate School.

Who: St Mary's School Caterton, Event: Product - Popcorn, 
Why: Fundraising for outdoor heaters in newly covered quad

St Mary's School Carterton is selling delicious gourmet popcorn to raise funds for outdoor heaters in our newly covered quad.

Now that this great outdoor space can be used year-round, we want to keep it comfortable and warm for our students, making it a welcoming place for learning, play, and gathering even on chilly days.

This tasty popcorn is perfect for lunchboxes, movie nights, or sharing with whanau and every purchase helps create a cosier outdoor space for our tamariki.

Thank you for your support!

END OF EXAMPLES 

Try to mimick the provided examples in style, pacing etc, making sure only to substitute and add on what you feel is necessary to best provide context for the fundraiser. 
Please put <br> after each section.
The last section where you thank the donators should always have <br> before it
For product fundraisers, please make sure to explain what the products are in the last section as done in the exemplars (before thanking donors of course)


`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Response Status:', response.status);
      console.error('Gemini API Response Text:', errText);
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const result = await response.json();
    
    // Extract the generated text from Gemini's response format
    const generatedWhy = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response. Please try again.';

    res.json({ why: generatedWhy.trim() });
  } catch (error) {
    console.error('Error generating why:', error);
    res.status(500).json({ error: error.message || 'Failed to generate why statement' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});