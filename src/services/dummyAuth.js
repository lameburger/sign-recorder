// This file creates a dummy user for testing purposes
// You can use this email and password to log in without registration

const createDummyUser = () => {
  const dummyUser = {
    uid: 'dummy-user-123',
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User'
  };

  // Get existing users or create empty array
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if dummy user already exists
  const userExists = users.some(user => user.email === dummyUser.email);
  
  if (!userExists) {
    // Add dummy user to users array
    localStorage.setItem('users', JSON.stringify([...users, dummyUser]));
    console.log('Dummy user created with email: test@example.com and password: password123');
  } else {
    console.log('Dummy user already exists');
  }

  // For testing purposes, automatically log in the dummy user
  // This will make it easier to test other functions
  const { password, ...userWithoutPassword } = dummyUser;
  localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
  console.log('Automatically logged in as test user for testing purposes');
};

export default createDummyUser;