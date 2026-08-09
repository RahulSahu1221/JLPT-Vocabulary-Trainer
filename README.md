<!-- ==========================================================================================
     JLPT N5–N4 Vocabulary Trainer
     README.md
     Part 1
=========================================================================================== -->

<div align="center">

# 🎌 JLPT N5–N4 Vocabulary Trainer

### *Master Japanese Vocabulary Through Smart Learning.*

<p align="center">

A modern **Progressive Web Application (PWA)** designed to help learners master **JLPT N5–N4 vocabulary** using **Spaced Repetition**, **Interactive Flashcards**, **Gamified Learning**, **Advanced Analytics**, and **Offline Study**.

Built entirely using **Vanilla HTML, CSS, and JavaScript** without any frontend frameworks.

</p>

---

<p align="center">

<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">

<img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">

<img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white">

<img src="https://img.shields.io/badge/Offline%20Ready-success?style=for-the-badge">

<img src="https://img.shields.io/badge/Responsive-Yes-blue?style=for-the-badge">

<img src="https://img.shields.io/badge/Dark%20Mode-Available-black?style=for-the-badge">

<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">

</p>

---

<p align="center">

🌐 **Live Website**

### https://rahulsahu1221.github.io/RONIN/

</p>

---

### If you like this project, please consider giving it a star!

</div>

---

# Table of Contents

- Overview
- Why this Project?
- Key Features
- Screenshots
- Technologies Used
- Project Highlights
- System Architecture
- Application Workflow
- Folder Structure
- Installation
- Running the Project

*(More sections continue in Part 2)*

---

# Overview

Learning Japanese vocabulary is often repetitive, difficult to maintain, and lacking meaningful progress tracking. Most vocabulary applications provide only flashcards or quizzes, making it difficult for learners to stay motivated over long periods.

The **JLPT N5–N4 Vocabulary Trainer** addresses these challenges by combining modern web technologies with proven learning techniques into a single Progressive Web Application (PWA).

The application provides an engaging and structured learning experience through:

- Intelligent Spaced Repetition
- Interactive Flashcards
- Vocabulary Games
- Dashboard Analytics
- Progress Tracking
- JLPT Readiness Analysis
- Custom Vocabulary Decks
- Offline Learning Support

Everything runs entirely inside the browser without requiring any backend server or database.

---

# Why this Project?

The objective of this project was to create a complete learning platform rather than just another vocabulary application.

Instead of simply displaying vocabulary, the application helps users:

- Learn efficiently
- Review intelligently
- Practice interactively
- Track progress
- Stay motivated

The project demonstrates modern frontend engineering concepts while remaining lightweight and framework-independent.

---

# Key Features

## Vocabulary Learning

- JLPT N5 & N4 vocabulary database
- Kanji
- Hiragana
- English meanings
- Memory hints
- Example sentences
- Emoji categorization

---

## Smart Spaced Repetition (SRS)

- Adaptive review scheduling
- Intelligent memory reinforcement
- Due review reminders
- Weak word tracking
- Review statistics

---

## Interactive Quiz Engine

- Multiple quiz modes
- Instant scoring
- Progress tracking
- Randomized questions
- Performance feedback

---

## Educational Games

- Memory Match
- Meteor Game
- Shiritori
- Mock Test

Designed to make vocabulary revision enjoyable while reinforcing memory.

---

## Analytics Dashboard

- Daily learning statistics
- Heatmap visualization
- Learning progress
- XP System
- Level progression
- JLPT readiness estimation
- Review summaries

---

## Custom Vocabulary Decks

- Create personal decks
- Save favourite words
- Track learned vocabulary
- Weak vocabulary collection
- Organize words by category

---

## Intelligent Search

Search vocabulary using:

- Kanji
- Hiragana
- Romaji
- English meanings

---

## Progressive Web App

- Installable on desktop
- Installable on Android
- Offline support
- Fast loading
- Native-like experience

---

## Modern User Experience

- Glassmorphism UI
- Dark & Light themes
- Responsive layout
- Animated WebGL background
- Smooth transitions
- Mobile-first navigation

---

# Screenshots

> Replace the placeholders below with actual screenshots after uploading them to your repository.

---

## Dashboard

```text
images/dashboard.png
```

---

## Vocabulary

```text
images/vocabulary.png
```

---

## Review

```text
images/review.png
```

---

## Games

```text
images/games.png
```

---

## Quiz

```text
images/quiz.png
```

---

## Settings

```text
images/settings.png
```

## Decks

```text
images/decks.png
```

---

# Technologies Used

| Technology | Purpose |
|------------|----------|
| HTML5 | Application Structure |
| CSS3 | User Interface |
| Vanilla JavaScript | Core Application Logic |
| Local Storage | Data Persistence |
| Service Worker | Offline Support |
| Web App Manifest | Installable PWA |
| Web Speech API | Japanese Pronunciation |
| WebGL | Animated Background |
| GitHub Pages | Deployment |

---

# Project Highlights

✔ Progressive Web Application (PWA)

✔ Offline Learning

✔ No Backend Required

✔ Framework Independent

✔ Modular JavaScript Architecture

✔ Modern Glassmorphism Interface

✔ Responsive Design

✔ Interactive Vocabulary Games

✔ Intelligent Spaced Repetition

✔ Dashboard Analytics

✔ Custom Vocabulary Decks

✔ Local Storage Persistence

✔ Mobile Friendly

✔ Dark & Light Themes

✔ High Performance

---

# System Architecture

```text
                        User

                          │

                          ▼

                 JLPT Trainer Dashboard

                          │

        ┌─────────────────┼─────────────────┐

        ▼                 ▼                 ▼

 Vocabulary          Quiz Engine        Game Engine

        │                 │                 │

        ▼                 ▼                 ▼

 Flashcards         Score System      Interactive Games

        │

        ▼

 Spaced Repetition Engine

        │

        ▼

 Local Storage Database

        │

        ▼

 Analytics Dashboard

        │

        ▼

 Progress Visualization
```

---

# Application Workflow

```text
Launch Application

        │

        ▼

Select Lesson

        │

        ▼

Browse Vocabulary

        │

        ▼

Study Flashcards

        │

        ▼

Practice Using Quiz

        │

        ▼

Play Educational Games

        │

        ▼

Review Incorrect Words

        │

        ▼

Spaced Repetition

        │

        ▼

Progress Analytics

        │

        ▼

Improve JLPT Readiness
```

---

# Project Structure

```text
JLPT-Vocabulary-Trainer
│
├── index.html
├── style.css
├── app.js
├── decks.js
├── games.js
├── sw.js
├── manifest.json
├── package-lock.json
│
├── data
│     ├── assets
│     ├── lesson1.json
│     ├── lesson2.json
│     ├── lesson3.json
│     ├── ...
│     └── lesson50.json
│
├── images
│
├── README.md
│
└── LICENSE
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/rahulsahu1221/JLPT-Vocabulary-Trainer.git
```

Navigate to the project directory

```bash
cd JLPT-Vocabulary-Trainer
```

---

# Running the Project

Since the application is built using Vanilla JavaScript, no build tools are required.

You can run it using any local web server.

Using VS Code Live Server:

```text
Right Click → index.html → Open with Live Server
```

or using Node.js

```bash
npx serve .
```

The application will automatically open in your browser.

---

# Live Demo

## GitHub Pages

**https://rahulsahu1221.github.io/JLPT-Vocabulary-Trainer/**

---

> **Continue reading in Part 2**, where we'll dive into the application's core modules, Spaced Repetition System (SRS), quiz engine, educational games, analytics dashboard, Progressive Web App implementation, and more.

---

# Vocabulary Module

The Vocabulary Module serves as the core learning interface of the application. It provides an intuitive flashcard-based experience for studying JLPT N5–N4 vocabulary while supporting multiple learning methods.

Each vocabulary card contains carefully organized learning information to improve retention.

### Each card includes

- 🇯🇵 Kanji
- かな Hiragana Reading
- 🇬🇧 English Meaning
- Memory Hint
- Example Sentence
- Category
- Favorite Status

---

## Features

✔ Beautiful Flashcard Design

✔ Card Flip Animation

✔ Search Support

✔ Favorites

✔ Weak Words

✔ Learned Words

✔ Emoji Categorization

✔ Custom Deck Support

---

### Learning Flow

```text
Choose Lesson

      │

      ▼

Vocabulary List

      │

      ▼

Open Flashcard

      │

      ▼

Read Meaning

      │

      ▼

View Example

      │

      ▼

Save Progress
```

---

# Spaced Repetition System (SRS)

One of the most important components of the application is the **Spaced Repetition System (SRS)**.

Instead of reviewing every vocabulary word equally, the application intelligently schedules future reviews based on previous performance.

Words answered correctly become less frequent.

Words answered incorrectly appear more often.

This reduces unnecessary repetition while strengthening long-term memory.

---

## SRS Workflow

```text
Vocabulary

      │

      ▼

User Reviews Word

      │

      ▼

Correct?

   ┌───────────┐
   │           │

 YES          NO

   │           │

Increase     Reduce

Interval     Interval

   │           │

Update Review Schedule

      │

      ▼

Save to Local Storage
```

---

## Benefits

✔ Adaptive Learning

✔ Memory Reinforcement

✔ Intelligent Scheduling

✔ Reduced Study Time

✔ Better Long-Term Retention

---

# Quiz Engine

The Quiz Engine allows learners to evaluate their understanding after completing vocabulary lessons.

Questions are automatically generated from the selected lesson.

Every session is randomized to prevent memorization of question order.

---

## Quiz Features

- Random Questions

- Multiple Choice

- Score Calculation

- Instant Feedback

- Performance Summary

- Retry Incorrect Questions

---

### Quiz Workflow

```text
Select Lesson

      │

      ▼

Generate Questions

      │

      ▼

Answer Questions

      │

      ▼

Calculate Score

      │

      ▼

Performance Summary

      │

      ▼

Review Incorrect Answers
```

---

# Educational Games

To reduce monotony and improve engagement, several educational games have been integrated into the application.

Instead of passive memorization, users actively interact with vocabulary.

---

# Memory Match

A classic card matching game.

Users match vocabulary with corresponding meanings.

### Skills Improved

- Recognition
- Short-term Memory
- Vocabulary Recall

---

# Meteor Game

Japanese vocabulary falls from the top of the screen.

Players must quickly type the correct answer before the word reaches the bottom.

### Skills Improved

- Fast Recall

- Reading Speed

- Typing Accuracy

---

# Shiritori

Based on the traditional Japanese word game.

Players continue the vocabulary chain using the ending character of the previous word.

### Skills Improved

- Vocabulary Recall

- Japanese Reading

- Pattern Recognition

---

# Speed Round

A timed challenge that encourages quick thinking.

Users answer as many vocabulary questions as possible before time expires.

### Skills Improved

- Speed

- Accuracy

- Confidence

---

# Mock Test

Simulates an examination environment.

Includes

- Timer

- Random Questions

- Final Score

- Performance Review

---

# Dashboard

The Dashboard acts as the learning control center.

Instead of simply displaying vocabulary, it provides meaningful insights into learning progress.

---

## Dashboard Displays

- Total Learned Words

- Pending Reviews

- Weak Vocabulary

- XP

- Current Level

- Daily Activity

- Heatmap

- JLPT Readiness

---

# Learning Analytics

Learning progress is continuously monitored and visualized.

The analytics system enables users to understand strengths and weaknesses.

---

## Metrics

✔ Total Reviews

✔ Daily Progress

✔ Weekly Progress

✔ Learning Consistency

✔ Review Accuracy

✔ Learning Streak

✔ Vocabulary Mastery

---

# Activity Heatmap

Inspired by GitHub Contribution Graph.

The heatmap displays daily learning activity.

Darker colors indicate higher activity.

```text
Sun  Mon  Tue  Wed  Thu  Fri  Sat

🟩   🟨   🟩   ⬜   🟩   🟩   🟧
```

Benefits

- Build Learning Habit

- Visual Motivation

- Consistency Tracking

---

# XP & Level System

Learning is rewarded through experience points (XP).

Every completed activity contributes to the user's overall progress.

Examples include

- Reviewing Words

- Completing Quizzes

- Winning Games

- Daily Challenges

As XP increases, users unlock higher learning levels.

---

### Level Progression

```text
Beginner

      │

      ▼

Student

      │

      ▼

Learner

      │

      ▼

Scholar

      │

      ▼

Practitioner

      │

      ▼

Expert

      │

      ▼

Sensei
```

---

# Daily Challenge

Every day the application generates a unique vocabulary challenge.

Completing the challenge rewards bonus XP and encourages consistent learning.

---

# Custom Decks

Users can organize vocabulary into personalized collections.

Possible deck examples

- Difficult Words

- Travel Vocabulary

- Daily Conversation

- Examination Revision

- Frequently Forgotten Words

---

## Deck Features

✔ Create Deck

✔ Rename Deck

✔ Delete Deck

✔ Add Vocabulary

✔ Remove Vocabulary

✔ Quick Access

---

# Smart Search

The application supports intelligent searching across multiple writing systems.

Search can be performed using

- Kanji

- Hiragana

- Romaji

- English Meaning

This makes finding vocabulary significantly easier for beginners.

---

# Notifications

The application can notify users when vocabulary reviews become due.

Notifications help maintain learning consistency without requiring users to manually check review schedules.

---

# Theme System

Users can switch between

Light Theme

Dark Theme

The transition includes smooth animations and preserves user preference across sessions.

---

# Progressive Web Application (PWA)

The project has been developed as a Progressive Web Application.

This allows the application to behave similarly to a native mobile application.

---

## PWA Features

✔ Installable

✔ Offline Support

✔ Fast Loading

✔ Home Screen Shortcut

✔ Local Storage

✔ Responsive Design

✔ Service Worker

✔ Web Manifest

---

### Offline Workflow

```text
First Visit

      │

      ▼

Cache Resources

      │

      ▼

Disconnect Internet

      │

      ▼

Open Application

      │

      ▼

Continue Learning Offline
```

---

# Performance Optimization

The application has been optimized for fast loading and smooth interaction.

Optimizations include

- Modular JavaScript Architecture

- Efficient DOM Updates

- Local Storage Persistence

- Cached Assets

- Lazy Data Loading

- Lightweight Design

- Framework-Free Development

---

# Accessibility

Accessibility features have been considered throughout the application.

Implemented features include

✔ Keyboard Navigation

✔ Focus Indicators

✔ Semantic HTML

✔ Responsive Layout

✔ Screen Reader Friendly Labels

✔ High Contrast Support

---

# What's Next?

In **Part 3**, we'll cover:

- Security Architecture
- Browser APIs Used
- Performance Engineering
- Complete Repository Structure
- Developer Guide
- Contributing
- Future Roadmap
- Learning Outcomes
- References
- License
- A premium GitHub footer

---

# Security

Security was considered throughout the development of this application to ensure safe client-side execution and reliable data handling.

## Security Features

✔ Content Security Policy (CSP)

✔ HTML Sanitization

✔ Attribute Escaping

✔ Safe DOM Manipulation

✔ Trusted Origin Validation

✔ Secure Local Storage Access

✔ No Dynamic Code Execution (`eval`)

✔ Offline Resource Validation

---

## Security Architecture

```text
User Input

      │

      ▼

Input Validation

      │

      ▼

HTML Sanitization

      │

      ▼

Safe DOM Rendering

      │

      ▼

Application Logic

      │

      ▼

Local Storage
```

---

# Performance Engineering

The application was designed with performance as a priority while keeping the codebase framework-independent.

## Performance Optimizations

- Modular JavaScript Architecture
- Efficient DOM Updates
- Optimized Rendering
- Lightweight CSS
- Cached Assets
- Service Worker
- Offline Data Storage
- Responsive Images
- Browser-side State Management

---

## Performance Goals

| Metric | Target |
|---------|---------|
| First Load | Fast |
| Offline Load | Instant |
| Memory Usage | Low |
| Mobile Friendly | ✔ |
| Responsive | ✔ |

---

# Browser APIs Used

The project makes extensive use of modern browser APIs.

| API | Purpose |
|------|---------|
| Local Storage API | Store learning progress |
| Service Worker API | Offline caching |
| Web App Manifest | Installable PWA |
| Web Speech API | Japanese pronunciation |
| Notifications API | Review reminders |
| WebGL | Animated background |
| Fetch API | Lesson loading |
| RequestAnimationFrame | Smooth animations |

---

# Progressive Web Application (PWA)

This application behaves similarly to a native mobile application.

## Features

✔ Installable

✔ Offline Ready

✔ Fast Loading

✔ Native-like Experience

✔ Responsive

✔ Background Caching

---

## Installation

### Desktop

1. Open the application in Chrome or Edge.
2. Click the **Install** icon in the address bar.
3. Confirm installation.

### Android

1. Open the application in Chrome.
2. Tap **Add to Home Screen**.
3. Launch it like a native application.

---

# Project Design Principles

The application follows several software engineering principles.

### ✔ Modular Design

Each feature is organized into separate modules.

### ✔ Separation of Concerns

Logic, styling, and markup remain independent.

### ✔ Maintainability

The codebase is easy to extend and debug.

### ✔ Scalability

New lessons, games, or features can be added with minimal modification.

---

# Complete Repository Structure

```text
JLPT-Vocabulary-Trainer
│
├── index.html
├── style.css
├── app.js
├── ecks.js
├── games.js
├── sw.js
├── manifest.json
├── package-lock.json
│
├── data
│   ├── assets
│   │   ├── logo.jpg
│   │   ├── icons
│   │   └── images
│   │
│   ├── lesson1.json
│   ├── lesson2.json
│   ├── ...
│   └── lesson50.json
│
├── images
│   ├── dashboard.png
│   ├── vocabulary.png
│   ├── review.png
│   ├── games.png
│   ├── analytics.png
│   └── settings.png
│
├── LICENSE
└── README.md
```

---

# Development Workflow

```text
Requirement Analysis

        │

        ▼

UI / UX Design

        │

        ▼

Application Architecture

        │

        ▼

Implementation

        │

        ▼

Testing

        │

        ▼

Performance Optimization

        │

        ▼

Deployment

        │

        ▼

Maintenance
```

---

# Challenges Faced

During development, several technical challenges were encountered.

- Designing an intuitive learning experience.
- Implementing a browser-based Spaced Repetition System.
- Managing persistent client-side state.
- Maintaining responsive performance on mobile devices.
- Supporting offline functionality.
- Organizing a modular JavaScript architecture without frameworks.

Each challenge provided valuable practical experience in frontend engineering and browser technologies.

---

# Learning Outcomes

This project significantly improved my understanding of:

- Progressive Web Applications (PWA)
- Modern JavaScript (ES6+)
- Browser APIs
- Frontend Architecture
- State Management
- Service Workers
- Offline-first Design
- Responsive Web Design
- UI/UX Principles
- Educational Software Development
- Performance Optimization
- Secure Client-side Programming

---

# Future Roadmap

## Planned Features

- [ ] JLPT N3 Vocabulary
- [ ] AI Study Assistant
- [ ] Cloud Synchronization
- [ ] User Authentication
- [ ] Voice Recognition Practice
- [ ] Kanji Stroke Order Animation
- [ ] Writing Practice
- [ ] OCR Vocabulary Scanner
- [ ] Multiplayer Challenges
- [ ] Leaderboards
- [ ] Learning Insights with AI
- [ ] Mobile Companion App

---

# Contributing

Contributions are welcome.

If you would like to improve the project:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to your fork.
5. Open a Pull Request.

Please ensure that your code follows the existing project structure and coding style.

---

# Reporting Issues

If you encounter any bugs or have suggestions for improvements:

- Open a GitHub Issue.
- Clearly describe the problem.
- Include steps to reproduce it.
- Provide screenshots if applicable.

---

# License

This project is released under the **MIT License**.

You are free to use, modify, and distribute this project in accordance with the license terms.

---

### Connect

- GitHub: https://github.com/rahulsahu1221
- Live Demo: https://rahulsahu1221.github.io/JLPT-Vocabulary-Trainer/

---

# Acknowledgements

Special thanks to:

- The open-source JavaScript community.
- The JLPT learning community.
- Mozilla Developer Network (MDN).
- W3C Web Standards.
- Contributors to modern browser technologies.

---

# Support the Project

If you found this project useful or interesting,

please consider:

Starring the repository

Forking the project

Sharing feedback

Your support helps improve the project and encourages future development.

---

<div align="center">

# 🎌 ありがとうございました！

### Thank you for visiting this repository.

*"Learning one new word every day is another step toward fluency."*

---

### Made with love using HTML, CSS & JavaScript

**© 2026 Rahul Sahu**

</div>
