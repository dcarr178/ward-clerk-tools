describe('Log into church website', () => {

  // path to write data to
  const loginDataPath = "./data/login.json"
  const loginData = {
    unitNumber: 0,
    requestHeaders: {}
  }

  // write data to file after tests have ran
  after(() => {
    cy.writeFile(loginDataPath, JSON.stringify(loginData, null, 2))
  })

  it('Fetch member list', () => {

    // start cypress
    cy.server()

    // configure intercept for member-list
    cy.intercept('https://lcr.churchofjesuschrist.org/api/umlu/unit-org*', (req) => {

      // capture request headers and unitNumber to local file
      const url = new URL(req.url);
      loginData.unitNumber = url.searchParams.get('unitNumber');
      loginData.requestHeaders = req.headers

    })

    // execute cypress test
    cy.visit("https://lcr.churchofjesuschrist.org")
    cy.get('input[name=username]').type(`${Cypress.env('CHURCH_USERNAME')}{enter}`)
    cy.get('input[name=password]').type(`${Cypress.env('CHURCH_PASSWORD')}{enter}`)

    cy.get('platform-header').shadow().find("#slimLogo").should('contain', 'Church of Jesus Christ of Latter-day Saints')

    // now go to member list page
    cy.visit('https://lcr.churchofjesuschrist.org/records/member-list?lang=eng')
    cy.get('span').should('contain', 'Member List')

  })
})
