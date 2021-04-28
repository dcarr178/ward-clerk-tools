import { config as setEnvVars } from 'dotenv'
import cypress from "cypress"

setEnvVars()

export const updateLoginData = (): Promise<void> => {
  // The purpose of running cypress is to execute the lds authentication saml process in a browser and capture
  // valid, authenticated request headers that we can use in future api calls.
  console.log(`updating login`)
  return cypress
    .run({
      spec: './src/cypress-tests/membership-list_spec.js',
      env: {
        CHURCH_USERNAME: process.env.CHURCH_USERNAME,
        CHURCH_PASSWORD: process.env.CHURCH_PASSWORD
      },
      quiet: true
    })
    .then(() => {
      return // cypress result object is irrelevant so let's return void
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

