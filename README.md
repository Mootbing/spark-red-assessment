# Poke App Online



A real-time location sharing app built with Next.js and Firebase. This app allows users to share their location with friends and see their friends' locations in real-time on an interactive map.

## Project Overview

This project was developed as part of the Spark Red assessment, focusing on creating a full-stack application with modern web technologies.

### Implemented Features

#### Frontend
- **Components**: Modular React components for Map, Friend Cards, and Authentication
- **Mobile Responsiveness**: Fully responsive design that works on all device sizes (although I do have an app for IOS/android coming soon.)

#### Backend
- **User Authentication**: Complete phone number-based authentication using Firebase
- **Real-time Database**: Firebase Firestore for live location updates
- **API Integration**: Google Maps API for location visualization

#### Full-stack Features
- **Framework Integration**: Next.js (React) frontend with Firebase backend
- **Live Deployment**: Deployed on Vercel
- **Additional Features**: 
  - Real-time location updates
  - Time-based location history
  - Friend management system
  - Interactive map markers

## Development Time
- Total development time: ~13 hours
  - Frontend setup and components: 3 hours
  - Firebase integration and authentication: 4 hours
  - Map integration and location tracking: 5 hours
  - Deployment and documentation: 1 hour

## Running the Project

### Live Demo
Visit [https://spark-red-assessment.vercel.app/](https://spark-red-assessment.vercel.app/)

### Local Development Setup

1. Clone the repository:
2. make a .env.local file in root and fill with 
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```
3. ```npm run build && npm start```