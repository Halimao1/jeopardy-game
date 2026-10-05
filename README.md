# Jeopardy Game

An interactive Jeopardy-style web game that generates randomized categories and questions using data from a REST API.

## Features

- Generates 6 random Jeopardy categories with 5 questions each
- Fetches live question and category data from an external API
- Click a tile to reveal the question, then click again to reveal the answer
- Generates a new game when restarted
- Filters incomplete API data to ensure playable categories
- Handles loading states and API errors
- Supports keyboard interaction with Enter and Space
- Responsive design for smaller screens

## Technologies Used

- JavaScript
- HTML5
- CSS3
- jQuery
- Axios
- Lodash
- REST API

## How It Works

The application retrieves category data from the Jeopardy API and randomly selects six usable categories. It then retrieves and filters the clues for each category before dynamically building the game board.

Each game tile keeps track of its current state:

`? → Question → Answer`

Restarting the game fetches a new randomized set of categories and questions.

## Live Demo

[Play the Jeopardy Game](ADD-LIVE-LINK-HERE)

## What I Practiced

This project gave me hands-on experience with:

- Asynchronous JavaScript and `async/await`
- Working with REST APIs
- DOM manipulation
- Application state
- Event handling
- Error handling
- Dynamic UI rendering
