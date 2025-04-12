# Civic Pulse

Civic Pulse is a community-driven web application that allows residents to report, discuss, and vote on local issues within their neighborhoods. This platform empowers citizens to highlight concerns, collaborate on solutions, and engage with their community in a transparent, accessible way.

## 🌟 Features

### User Authentication & Profiles
- **Email/Password Signup**: Create an account with username, email, and password
- **Secure Login**: Access your personalized dashboard
- **User Profiles**: Username display throughout the platform

### Issue Management
- **Create Issues**: Post neighborhood concerns with title and detailed description
- **View Issues**: Browse issues sorted by popularity (votes) and recency
- **Neighborhood Filtering**: Filter issues by specific neighborhoods

### Community Interaction
- **Voting System**: Upvote or downvote issues to highlight community priorities
- **Commenting**: Engage in discussions about specific issues
- **Edit & Delete**: Manage your own comments with real-time updates
- **Public Access**: Anyone can view issues, while interactions require login

### User Experience
- **Reddit-Inspired Layout**: Intuitive interface with voting controls and content display
- **Responsive Design**: Modern, clean interface that works across devices
- **Time Formatting**: Relative timestamps for posts and comments

## 🛠️ Technologies

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **UI Framework**: Bootstrap 5 with custom styling
- **Backend**: Firebase
  - Authentication for user management
  - Firestore for database storage
  - Firebase Hosting for deployment
- **Security**: Firestore security rules to protect user content

## 📋 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/raktimrabha/Civic-Pulse.git
   cd Civic-Pulse
   ```

2. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Add your Firebase configuration in `src/app.js`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the application locally:
   ```bash
   npm start
   ```

## 🚀 Usage

1. **Signup/Login**: Create an account or login with your credentials
2. **Browse Issues**: View and filter local issues by neighborhood
3. **Create Issues**: Add new issues affecting your community
4. **Interact**: Vote on issues and participate in discussions
5. **Manage Content**: Edit or delete your own comments

## 🔮 Future Development

- Google Sign-in integration
- Official Authority Accounts for community officials
- Image/Media Upload capabilities
- Issue Status Tracking (Reported, In Progress, Resolved)
- User Reputation System
- Advanced Search and Filtering
- Notifications
- Direct Messaging
- Community Creation and Moderation Tools

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

If you have any questions or suggestions, please open an issue or contact the repository owner.

---

Civic Pulse - Amplifying community voices, one neighborhood at a time.