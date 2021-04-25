import { config as setEnvVars } from 'dotenv'
import cypress from "cypress"

setEnvVars()

export const fetchMembershipListToDataFile = (): Promise<void> => {
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

