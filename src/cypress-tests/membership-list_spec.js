describe('Log into church website', () => {

  // data to collect from cypress
  const data = {
    urls: [],
    memberList: {
      req: {},
      response: {}
    }
  }

  // path to write data to
  const dataPath = "./cypress-data.json"

  // write data to file after tests have ran
  after(() => {
    cy.writeFile(dataPath, JSON.stringify(data, null, 2))
  })

  it('Fetch member list', () => {

    // start cypress
    cy.server()

    // configure intercept for urls
    cy.intercept('*', (req) => {
      data.urls.push(`${req.method} ${req.url}`)
    })

    // configure intercept for member-list
    cy.intercept('https://lcr.churchofjesuschrist.org/services/umlu/report/member-list*', (req) => {
      data.memberList.req = req
      req.continue((res) => {
        data.memberList.response = res
      })
    })

    // execute cypress test
    cy.visit('https://lcr.churchofjesuschrist.org/records/member-list')
    cy.get('input[name=username]').type(`${Cypress.env('CHURCH_USERNAME')}{enter}`)
    cy.get('input[name=password]').type(`${Cypress.env('CHURCH_PASSWORD')}{enter}`)
    cy.get('span').should('contain', 'Member List')

  })
})
