# Contribution Tracker

This project is a contribution tracker for GitHub repositories, allowing users to visualize and compare progress across multiple projects.

## Features

- Display repository statistics including stars, forks, and commit counts
- Filter data by custom date ranges
- Leaderboard to compare repository progress
- Admin panel for managing announcements
- Responsive design for various screen sizes

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- npm (v6 or later)
- A GitHub Personal Access Token with repo scope

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/sharanrp/contribution-tracker.git
   cd contribution-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your GitHub token:
   ```
   REACT_APP_GITHUB_TOKEN=your_github_personal_access_token
   ```

## Running the Application

To start the development server:

## TODOs

- [ ] Track Contributions of around 60 repositories in each of their branches
- [X] Identify Repos which have no commits in current week
- [X] Identify members who dont have commits in current week
- [X] For points 2 and 3 implement a bot
- [X] Also Create a discord bot to display these members names
- [ ] Store their discord usernames in a db to send notifications to them
