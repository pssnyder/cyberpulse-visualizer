
# CyberPulse Music Visualizer

CyberPulse is a futuristic music visualizer that reacts to live microphone input. Users can customize the visual experience through interactive controls for "Punch," "Vibe," and "Mood." The application is built with React, TypeScript, and Tailwind CSS, and uses the Web Audio API for audio processing.

## Features

*   **Live Microphone Input**: Visualizes audio captured from your microphone.
*   **Dynamic Visuals**:
    *   Central "bass pulse" glow that reacts to low-frequency sounds.
    *   Full-width frequency bars at the bottom of the screen.
    *   Particle system that responds to audio and "Vibe" settings.
*   **Customizable Controls**:
    *   **Punch**: Adjusts the emphasis on certain frequencies, making the visuals more impactful.
    *   **Vibe**: Modifies the visual style from smooth and clean to more chaotic and energetic.
    *   **Mood**: Changes the color palette (Cool, Warm, Full Spectrum).
*   **UI Auto-Hide**: Header and controls panel automatically hide after a period of mouse inactivity, providing an immersive visual experience.
*   **Fullscreen Mode**: Toggle fullscreen for an unobstructed view.
*   **Responsive Design**: Adapts to different screen sizes.

## How to Use (Running Locally)

To run CyberPulse Music Visualizer locally, you'll need a modern web browser and a simple HTTP server.

1.  **Clone or Download the Project:**
    If you have the project files, ensure they are all in a single directory.

2.  **Navigate to the Project Directory:**
    Open your terminal or command prompt and change to the directory where `index.html` is located.
    ```bash
    cd path/to/your/cyberpulse-visualizer
    ```

3.  **Start a Local HTTP Server:**
    Here are a few common ways:

    *   **Using Python 3:**
        ```bash
        python -m http.server
        ```
        (By default, this serves on port 8000. You can specify a port: `python -m http.server 8080`)

    *   **Using Python 2:**
        ```bash
        python -m SimpleHTTPServer
        ```
        (Also defaults to port 8000)

    *   **Using Node.js with `serve`:**
        If you don't have `serve` installed globally, install it:
        ```bash
        npm install -g serve
        ```
        Then run:
        ```bash
        serve .
        ```
        (This usually serves on port 3000 or 5000)

4.  **Open in Browser:**
    Once the server is running, it will typically show a URL like `http://0.0.0.0:8000` or `http://localhost:8000`.
    Open your web browser and go to this address.

5.  **Activate Microphone:**
    *   The application will prompt you to activate your microphone.
    *   Click the "Activate Microphone" button.
    *   Your browser will ask for permission to use the microphone. Click "Allow."
    *   Once the microphone is active, the visuals will start reacting to the audio input.

    **Note on HTTPS for Microphone:** Some browsers are stricter and may require HTTPS for microphone access even on `localhost`. If you encounter issues, deploying to a service that provides HTTPS (see below) or setting up a local HTTPS server might be necessary.

## Deployment

CyberPulse is a static web application and can be easily deployed to various hosting platforms. Here are a few popular options:

### 1. Netlify

*   Sign up for a free account at [netlify.com](https://netlify.com).
*   Push your project code to a Git repository (e.g., GitHub, GitLab, Bitbucket).
*   On your Netlify dashboard, click "Add new site" -> "Import an existing project."
*   Connect to your Git provider and select your repository.
*   Configure the deployment settings:
    *   **Build command:** Leave this blank (or set to your build command if you add one later).
    *   **Publish directory:** Set this to the root directory of your project (where `index.html` is located, often `/` or `.` or left as default).
*   Click "Deploy site." Netlify will deploy your site and provide a unique URL (e.g., `your-site-name.netlify.app`). Netlify automatically provides HTTPS.

### 2. Vercel

*   Sign up for a free account at [vercel.com](https://vercel.com).
*   Connect your Git repository.
*   Vercel usually auto-detects static sites. Ensure the "Root Directory" is set correctly to where your `index.html` resides.
*   Deploy your project. Vercel will provide a URL and handles HTTPS.

### 3. GitHub Pages

*   Ensure your code is in a GitHub repository.
*   Go to your repository on GitHub.com.
*   Click on "Settings."
*   In the left sidebar, click on "Pages."
*   Under "Build and deployment," choose "Deploy from a branch" as the source.
*   Select the branch you want to deploy (e.g., `main`).
*   For the folder, select `/ (root)`.
*   Click "Save."
*   Your site will become available at `https://<your-username>.github.io/<your-repository-name>/`. It might take a few minutes to go live. GitHub Pages also provides HTTPS.

**Important for Deployed Version:**
Microphone access (`navigator.mediaDevices.getUserMedia`) **requires HTTPS** when deployed to the internet. The platforms listed above handle this automatically.

## Project Structure

*   `index.html`: The main HTML file.
*   `index.tsx`: The entry point for the React application.
*   `App.tsx`: The main application component, managing state and layout.
*   `components/`: Contains all React components.
    *   `Visualizer.tsx`: The core canvas-based visualizer.
    *   `ControlsPanel.tsx`: UI for punch, vibe, and mood sliders.
    *   `Slider.tsx`: Reusable slider component.
    *   `NowPlayingDisplay.tsx`: Displays microphone errors.
    *   `FullscreenButton.tsx`: UI for toggling fullscreen mode.
*   `hooks/`: Contains custom React hooks.
    *   `useMicrophoneData.ts`: Manages microphone input, permissions, and audio processing (including AGC).
*   `types.ts`: TypeScript type definitions.
*   `constants.ts`: Shared constants for the application.
*   `metadata.json`: Project metadata.

Enjoy the CyberPulse Music Visualizer!
