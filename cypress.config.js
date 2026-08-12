import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: true,
    videosFolder: 'cypress/videos',
    videoCompression: 20,
    screenshotOnRunFailure: true,
  },
  viewportWidth: 1280,
  viewportHeight: 720,
})
