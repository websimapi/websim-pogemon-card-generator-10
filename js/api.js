import { getTypeIcon, getTypeColor } from './utils.js';

export async function getCurrentUserFollowData() {
  try {
    // Fetch current user's followers
    const followersResponse = await fetch('/api/v1/user/followers');
    const followersData = await followersResponse.json();
    
    // Fetch current user's following
    const followingResponse = await fetch('/api/v1/user/following'); 
    const followingData = await followingResponse.json();
    
    // Combine and deduplicate users
    const allUsers = new Set([
      ...followersData.followers.data.map(f => f.follow.user),
      ...followingData.following.data.map(f => f.follow.user)
    ]);

    return Array.from(allUsers);
  } catch (error) {
    console.error('Error fetching follow data:', error);
    return [];
  }
}

export async function getUserDescription(userData) {
  try {
    const prompt = `Create a unique character card description for a user based on their profile data. Use their username and any available profile info to construct a creative character type and description.

    User Data:
    Username: ${userData.username}
    Description: ${userData.description || 'No description available'}
    Created: ${userData.created_at}
    
    Return a detailed character card including:
    - A fantasy class/type derived from their profile theme
    - Physical attributes that match their persona
    - Special abilities or traits based on their interests
    - A brief but vivid description of their character

    Format the response as:
    {
      "name": string, // Their username
      "type": string, // 1-2 types like "Celestial/Light" or "Nature" 
      "description": string, // ~50 word creative description
      "height": string, // Reasonable height like "1.8m"
      "weight": string // Reasonable weight like "75kg"
    }

    Example:
    {
      "name": "skyweaver",
      "type": "Celestial/Air",
      "description": "A mystical artisan who weaves stardust into digital tapestries. Their crystalline wings shimmer with cosmic energy as they float through the virtual aether, leaving trails of twinkling code in their wake.",
      "height": "1.7m",
      "weight": "65kg"
    }`;

    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ prompt, data: userData }),
    });
    
    const data = await response.json();
    return {
      ...data,
      id: userData.id,
      avatarUrl: userData.avatar_url
    };
  } catch (error) {
    console.error('Error generating user description:', error);
    return {
      name: userData.username,
      type: 'Unknown',
      description: 'Failed to generate description',
      height: 'Unknown',
      weight: 'Unknown',
      id: userData.id,
      avatarUrl: userData.avatar_url
    };
  }
}

export async function generateUserImage(userAvatarUrl, description) {
  try {
    if (userAvatarUrl) {
      // If user has an avatar, fetch and return it
      const response = await fetch(userAvatarUrl);
      if (response.ok) {
        return userAvatarUrl;
      }
    }

    // If no avatar or fetch failed, generate an AI image
    const prompt = `Generate a unique fantasy character portrait based on this description: "${description}". The image should be artistic and profile-picture suitable.

    interface Response {
      imageUrl: string;
    }

    Example response:
    {
      "imageUrl": "https://example.com/character-portrait.jpg"
    }`;

    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ prompt, data: description }),
    });

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating user image:', error);
    return null;
  }
}